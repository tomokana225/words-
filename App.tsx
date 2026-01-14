
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

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [view, setView] = useState<'dashboard' | 'quiz' | 'detail' | 'diagnosis' | 'admin' | 'level_preview'>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel | 'ALL' | 'REVIEW' | 'WEAK'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  // 管理者判定 (Cloudflare Secret の ADMIN_EMAIL と比較)
  const isAdmin = useMemo(() => {
    const adminEmail = getAdminEmail();
    return user?.email && adminEmail && user.email === adminEmail;
  }, [user]);

  useEffect(() => {
    const init = async () => {
      // 1. Firebase初期化 (Cloudflare Secretsフェッチ)
      await initializeFirebase();
      
      // 2. 認証状態の監視
      const unsubscribe = onAuthChange(async (fbUser) => {
        setUser(fbUser);
        if (fbUser) {
          setIsSyncing(true);
          try {
            // クラウドからのみデータを取得 (LocalStorageは使用しない)
            const cloudWords = await fetchUserWords(fbUser.uid);
            setWords(cloudWords);
          } catch (e) {
            console.error("Cloud Sync Error:", e);
          } finally {
            setIsSyncing(false);
          }
        } else {
          // 未ログイン時は単語リストを空にする
          setWords([]);
        }
        setIsAppReady(true);
      });

      return () => unsubscribe();
    };
    init();
  }, []);

  const handleUpdateWord = useCallback(async (updated: Word) => {
    // 管理者でない場合は単語情報の更新（マスターデータの上書き）を制限する運用も可能ですが、
    // ここでは個人の進捗保存として機能させます。
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
      // グローバルDBへの保存は管理者のみ
      if (isAdmin) await saveWordToDB(updated);
    }
  }, [user, isAdmin]);

  const handleBatchImport = useCallback(async (newWords: Word[]) => {
    if (!isAdmin || !user) return;

    setWords(prev => {
      const wordMap = new Map<string, Word>();
      prev.forEach(w => wordMap.set(w.term.toLowerCase(), w));
      newWords.forEach(w => {
        const key = w.term.toLowerCase();
        wordMap.set(key, { ...(wordMap.get(key) || {}), ...w });
      });
      return Array.from(wordMap.values());
    });
    
    await Promise.all(newWords.map(async (w) => {
      await saveUserWordProgress(user.uid, w);
      await saveWordToDB(w);
    }));
    setView('dashboard');
  }, [user, isAdmin]);

  const saveQuizResults = useCallback(async (results: QuizResult) => {
    if (!user) return;

    const updatedBatch: Word[] = [];
    setWords(prev => {
      const nextWords = [...prev];
      results.questions.forEach((q, i) => {
        const idx = nextWords.findIndex(w => w.term === q.word.term);
        if (idx > -1) {
          const w = { ...nextWords[idx] };
          const isCorrect = results.userAnswers[i] === q.correctIndex;
          
          if (isCorrect) {
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
          updatedBatch.push(w);
        }
      });
      return nextWords;
    });

    for (const w of updatedBatch) {
      await saveUserWordProgress(user.uid, w);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl mb-10"></div>
        <h2 className="font-black text-slate-800 text-3xl tracking-tight mb-2">EikenMaster AI</h2>
        <p className="text-slate-400 font-bold">同期を確立しています...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 relative font-['Noto_Sans_JP']">
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
              ...(isAdmin ? [{ id: 'admin', label: '管理者：一括登録', icon: <path d="M12 20v-8m0 0V4m0 8h8m-8 0H4"/> }] : []),
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setView(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${view === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">{item.icon}</svg>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="pt-8 border-t border-slate-100">
             {!isFirebaseReady() ? (
               <div className="mb-4 px-4 py-3 bg-amber-50 text-amber-600 text-[11px] font-black rounded-xl border border-amber-100 leading-tight">
                 ⚠️ 未設定モード
               </div>
             ) : (
               <div className="mb-4 px-4 py-3 bg-emerald-50 text-emerald-600 text-[11px] font-black rounded-xl border border-emerald-100 leading-tight">
                 ✅ Firebase同期中
               </div>
             )}
             {isSyncing && (
               <div className="mb-4 px-4 py-2 bg-indigo-50 text-indigo-500 text-[10px] font-black rounded-lg animate-pulse flex items-center gap-2">
                 <div className="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></div>
                 更新中...
               </div>
             )}
             {user ? (
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 overflow-hidden">
                 <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-10 h-10 rounded-xl shadow-sm shrink-0" alt="User"/>
                 <div className="min-w-0">
                   <p className="font-bold text-slate-700 truncate text-sm">{user.displayName || user.email}</p>
                   {isAdmin && <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">ADMIN</span>}
                   <button onClick={logout} className="block text-[10px] font-black text-rose-500 hover:underline">ログアウト</button>
                 </div>
               </div>
             ) : (
               <button onClick={loginWithGoogle} className="w-full py-4 gradient-primary text-white rounded-2xl font-black shadow-lg bounce-on-click">
                 Googleでログイン
               </button>
             )}
          </div>
        </aside>
      )}

      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 ${view === 'quiz' ? 'pt-0' : 'pt-8'} pb-32`}>
        {view === 'dashboard' && (
          <Dashboard 
            words={words} 
            isAdmin={isAdmin}
            onSelectLevel={(l) => { setSelectedLevel(l as any); setView('level_preview'); }} 
            onViewWord={(w) => { setCurrentWord(w); setView('detail'); }} 
            onQuickAdd={(t) => { 
              if (!isAdmin) return;
              setCurrentWord({ id: `q-${Date.now()}`, term: t, meaning: '解析中...', level: EikenLevel.GRADE_3 }); 
              setView('detail'); 
            }} 
          />
        )}
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
