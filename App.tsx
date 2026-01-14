
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EikenLevel, Word, QuizResult } from './types';
import Dashboard from './components/Dashboard';
import QuizView from './components/QuizView';
import WordDetailView from './components/WordDetailView';
import DiagnosisView from './components/DiagnosisView';
import AdminView from './components/AdminView';
import LevelWordListView from './components/LevelWordListView';
import { 
  initializeFirebase,
  onAuthChange, 
  loginWithGoogle, 
  logout, 
  fetchUserWords, 
  saveUserWordProgress,
  saveWordToDB,
  getAdminEmail,
  isFirebaseReady
} from './services/firebaseService';
import { User } from 'firebase/auth';

const INITIAL_WORDS: Word[] = [
  { id: 'start-1', term: 'Consequence', meaning: '結果、影響', level: EikenLevel.GRADE_2 },
  { id: 'start-2', term: 'Abundance', meaning: '豊富、大量', level: EikenLevel.GRADE_PRE_1 },
  { id: 'start-3', term: 'Diminish', meaning: '減少させる', level: EikenLevel.GRADE_2 },
  { id: 'start-4', term: 'Comprehensive', meaning: '包括的な、広範囲な', level: EikenLevel.GRADE_1 },
];

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [view, setView] = useState<'dashboard' | 'quiz' | 'detail' | 'diagnosis' | 'admin' | 'level_preview'>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel | 'ALL' | 'REVIEW' | 'WEAK'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  // 管理者かどうかを判定
  const isAdmin = useMemo(() => {
    return user?.email === getAdminEmail();
  }, [user]);

  // 1. 初期化シーケンス
  useEffect(() => {
    const init = async () => {
      // Cloudflareのシークレットから構成をフェッチしてFirebaseを起動
      await initializeFirebase();
      
      // ローカル単語データの復元
      const local = localStorage.getItem('eiken_ai_words');
      if (local) {
        setWords(JSON.parse(local));
      } else {
        setWords(INITIAL_WORDS);
      }
      
      // 認証の監視開始
      const unsubscribe = onAuthChange(async (fbUser) => {
        setUser(fbUser);
        if (fbUser) {
          setIsSyncing(true);
          try {
            const cloudWords = await fetchUserWords(fbUser.uid);
            if (cloudWords.length > 0) {
              setWords(prev => {
                const wordMap = new Map<string, Word>();
                cloudWords.forEach(cw => wordMap.set(cw.term.toLowerCase(), cw));
                prev.forEach(w => {
                  if (!wordMap.has(w.term.toLowerCase())) wordMap.set(w.term.toLowerCase(), w);
                });
                return Array.from(wordMap.values());
              });
            }
          } finally {
            setIsSyncing(false);
          }
        }
        setIsAppReady(true);
      });

      return () => unsubscribe();
    };
    init();
  }, []);

  // データの保存 (LocalStorage)
  useEffect(() => {
    if (isAppReady && words.length > 0) {
      localStorage.setItem('eiken_ai_words', JSON.stringify(words));
    }
  }, [words, isAppReady]);

  const handleUpdateWord = useCallback(async (updated: Word) => {
    setWords(prev => {
      const idx = prev.findIndex(w => w.term.toLowerCase() === updated.term.toLowerCase());
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], ...updated };
        return copy;
      }
      return [...prev, updated];
    });
    
    if (user) {
      await saveUserWordProgress(user.uid, updated);
      if (isAdmin) await saveWordToDB(updated);
    }
  }, [user, isAdmin]);

  const handleBatchImport = async (newWords: Word[]) => {
    setWords(prev => {
      const currentMap = new Map(prev.map(w => [w.term.toLowerCase(), w]));
      newWords.forEach(nw => {
        currentMap.set(nw.term.toLowerCase(), { ...currentMap.get(nw.term.toLowerCase()), ...nw });
      });
      return Array.from(currentMap.values());
    });

    if (user) {
      for (const w of newWords) {
        await saveUserWordProgress(user.uid, w);
        if (isAdmin) await saveWordToDB(w);
      }
    }
    setView('dashboard');
  };

  const saveQuizResults = useCallback(async (results: QuizResult) => {
    const batch: Word[] = [];
    setWords(prev => {
      const nextWords = [...prev];
      results.questions.forEach((q, i) => {
        const idx = nextWords.findIndex(w => w.term === q.word.term);
        if (idx > -1) {
          const w = { ...nextWords[idx] };
          const correct = results.userAnswers[i] === q.correctIndex;
          if (correct) {
            w.streak = (w.streak || 0) + 1;
            w.difficultyScore = Math.max(0, (w.difficultyScore || 0) - 5);
            const intervals = [1, 3, 7, 14, 30];
            const days = intervals[Math.min(w.streak - 1, intervals.length - 1)];
            w.nextReviewDate = Date.now() + days * 24 * 60 * 60 * 1000;
            if (w.streak >= 5) w.isMastered = true;
          } else {
            w.streak = 0;
            w.difficultyScore = (w.difficultyScore || 0) + 15;
            w.nextReviewDate = Date.now() + 60 * 60 * 1000;
            w.isMastered = false;
          }
          nextWords[idx] = w;
          batch.push(w);
        }
      });
      return nextWords;
    });

    if (user) {
      for (const w of batch) await saveUserWordProgress(user.uid, w);
    }
  }, [user]);

  const quizPool = useMemo(() => {
    const now = Date.now();
    if (selectedLevel === 'REVIEW') return words.filter(w => !w.isMastered && w.nextReviewDate && w.nextReviewDate <= now);
    if (selectedLevel === 'WEAK') return words.filter(w => !w.isMastered && (w.difficultyScore || 0) > 20);
    if (selectedLevel === 'ALL') return words;
    return words.filter(w => w.level === selectedLevel);
  }, [words, selectedLevel]);

  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl mb-8"></div>
        <p className="font-black text-slate-800 text-2xl tracking-tight">EikenMaster AI 安全に起動中...</p>
        <p className="text-slate-400 font-bold mt-2">Cloudflare Secretsを読み込んでいます</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 relative">
      {view !== 'quiz' && (
        <aside className="hidden md:flex w-72 flex-col bg-white border-r border-slate-200 p-8 sticky top-0 h-screen z-50">
          <div onClick={() => setView('dashboard')} className="cursor-pointer mb-12 flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary text-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
               <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">EikenMaster AI</h1>
          </div>
          <nav className="flex-1 space-y-2">
            {[
              { id: 'dashboard', label: 'ホーム', icon: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> },
              { id: 'diagnosis', label: '単語力診断', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
              ...(isAdmin ? [{ id: 'admin', label: '一括登録', icon: <path d="M12 20v-8m0 0V4m0 8h8m-8 0H4"/> }] : []),
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${view === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">{item.icon}</svg>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="pt-8 border-t border-slate-100">
             {!isFirebaseReady() && (
               <div className="mb-4 px-4 py-2 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg flex items-center gap-2 border border-amber-100">
                 ⚠️ オフライン(モック)モード
               </div>
             )}
             {isSyncing && (
               <div className="mb-4 px-4 py-2 bg-indigo-50 text-indigo-500 text-[10px] font-black rounded-lg animate-pulse flex items-center gap-2">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                 クラウド同期中...
               </div>
             )}
             {user ? (
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 relative group">
                 <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-10 h-10 rounded-xl shadow-sm" alt="User"/>
                 <div className="overflow-hidden">
                   <div className="flex items-center gap-2">
                     <p className="font-bold text-slate-700 truncate text-sm">{user.displayName}</p>
                     {isAdmin && <span className="bg-amber-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm">ADMIN</span>}
                   </div>
                   <button onClick={() => logout()} className="text-[10px] font-black text-rose-500 hover:underline">LOGOUT</button>
                 </div>
               </div>
             ) : (
               <button onClick={() => loginWithGoogle()} className="w-full py-4 gradient-primary text-white rounded-2xl font-black shadow-lg bounce-on-click">Login</button>
             )}
          </div>
        </aside>
      )}

      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 ${view === 'quiz' ? 'pt-0' : 'pt-8'} pb-32`}>
        {view === 'dashboard' && <Dashboard words={words} onSelectLevel={(l) => { setSelectedLevel(l as any); setView('level_preview'); }} onViewWord={(w) => { setCurrentWord(w); setView('detail'); }} onQuickAdd={(t) => { setCurrentWord({ id: `q-${Date.now()}`, term: t, meaning: '解析中...', level: EikenLevel.GRADE_3 }); setView('detail'); }} />}
        {view === 'level_preview' && <LevelWordListView level={selectedLevel as any} words={quizPool} onStartQuiz={() => setView('quiz')} onBack={() => setView('dashboard')} onViewWord={(w) => { setCurrentWord(w); setView('detail'); }} />}
        {view === 'quiz' && <QuizView words={quizPool} onComplete={(r) => { saveQuizResults(r); setView('dashboard'); }} onViewWord={(w, r) => { saveQuizResults(r); setCurrentWord(w); setView('detail'); }} onCancel={() => setView('dashboard')} />}
        {view === 'detail' && currentWord && <WordDetailView word={currentWord} onUpdate={handleUpdateWord} onBack={() => setView('dashboard')} onSelectSynonym={(t) => { setCurrentWord({ id: `syn-${Date.now()}`, term: t, meaning: '解析中...', level: EikenLevel.GRADE_3 }); }} />}
        {view === 'admin' && isAdmin && <AdminView onImport={handleBatchImport} onCancel={() => setView('dashboard')} />}
        {view === 'diagnosis' && <DiagnosisView onCancel={() => setView('dashboard')} />}
      </main>
    </div>
  );
};

export default App;
