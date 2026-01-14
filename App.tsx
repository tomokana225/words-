
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EikenLevel, Word, QuizResult } from './types';
import Dashboard from './components/Dashboard';
import QuizView from './components/QuizView';
import WordDetailView from './components/WordDetailView';
import DiagnosisView from './components/DiagnosisView';
import AdminView from './components/AdminView';
import LevelWordListView from './components/LevelWordListView';
import CourseSelectionView from './components/CourseSelectionView';
import { 
  initializeFirebase,
  onAuthChange, 
  loginWithGoogle, 
  logout, 
  fetchUserWords, 
  fetchGlobalWords,
  saveUserWordProgress,
  saveWordToDB,
  getAdminEmail,
  isFirebaseReady
} from './services/firebaseService';
import { User } from 'firebase/auth';

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [view, setView] = useState<'dashboard' | 'quiz' | 'detail' | 'diagnosis' | 'admin' | 'level_preview' | 'course_selection'>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel | 'ALL' | 'REVIEW' | 'WEAK'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  const isAdmin = useMemo(() => {
    const adminEmail = getAdminEmail();
    return user?.email && adminEmail && user.email === adminEmail;
  }, [user]);

  useEffect(() => {
    const init = async () => {
      await initializeFirebase();
      
      const unsubscribe = onAuthChange(async (fbUser) => {
        setUser(fbUser);
        setIsSyncing(true);
        try {
          let userWords: Word[] = [];
          if (fbUser) {
            userWords = await fetchUserWords(fbUser.uid);
          }
          
          if (userWords.length > 0) {
            setWords(userWords);
            setView('dashboard');
          } else {
            // データがない場合はコース選択へ
            setView('course_selection');
          }
        } catch (e) {
          console.error("Sync Error:", e);
        } finally {
          setIsSyncing(false);
        }
        setIsAppReady(true);
      });

      return () => unsubscribe();
    };
    init();
  }, []);

  const handleSelectCourse = async (level: EikenLevel) => {
    setIsSyncing(true);
    try {
      const globals = await fetchGlobalWords();
      const filtered = globals.filter(w => w.level === level);
      
      // ログインしていれば初期進捗として保存
      if (user && filtered.length > 0) {
        await Promise.all(filtered.map(w => saveUserWordProgress(user.uid, w)));
      }
      
      setWords(filtered.length > 0 ? filtered : []);
      setSelectedLevel(level);
      setView('dashboard');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

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
    if (user) {
      for (const w of updatedBatch) {
        await saveUserWordProgress(user.uid, w);
      }
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
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="font-black text-slate-800 text-2xl">EikenMaster AI</h2>
        <p className="text-slate-400 font-bold mt-2">Ready for English Study...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 relative font-['Noto_Sans_JP'] overflow-x-hidden">
      {view !== 'quiz' && view !== 'course_selection' && (
        <aside className="hidden lg:flex w-72 flex-col bg-white border-r border-slate-200 p-8 sticky top-0 h-screen z-50">
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
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${view === item.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">{item.icon}</svg>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="pt-8 border-t border-slate-100">
             {isSyncing && (
               <div className="mb-4 px-4 py-2 bg-indigo-50 text-indigo-500 text-[10px] font-black rounded-lg animate-pulse flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></div>
                 同期中...
               </div>
             )}
             {user ? (
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 overflow-hidden">
                 <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-9 h-9 rounded-xl shadow-sm shrink-0" alt="User"/>
                 <div className="min-w-0">
                   <p className="font-bold text-slate-700 truncate text-xs">{user.displayName || user.email}</p>
                   <button onClick={logout} className="block text-[10px] font-black text-rose-500 hover:underline">ログアウト</button>
                 </div>
               </div>
             ) : (
               <button onClick={loginWithGoogle} className="w-full py-4 gradient-primary text-white rounded-2xl font-black shadow-lg text-sm">
                 ログイン
               </button>
             )}
          </div>
        </aside>
      )}

      {/* Mobile Navbar */}
      {view !== 'quiz' && view !== 'course_selection' && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex items-center justify-around p-4 z-[100] shadow-2xl pb-safe">
           <button onClick={() => setView('dashboard')} className={`p-3 rounded-2xl ${view === 'dashboard' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
           </button>
           <button onClick={() => setView('diagnosis')} className={`p-3 rounded-2xl ${view === 'diagnosis' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
           </button>
           {isAdmin && (
             <button onClick={() => setView('admin')} className={`p-3 rounded-2xl ${view === 'admin' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400'}`}>
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20v-8m0 0V4m0 8h8m-8 0H4"/></svg>
             </button>
           )}
           <button onClick={user ? logout : loginWithGoogle} className="p-3 text-slate-400">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
           </button>
        </nav>
      )}

      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 ${view === 'quiz' || view === 'course_selection' ? 'pt-0' : 'pt-6 md:pt-10'} pb-32`}>
        {view === 'course_selection' && <CourseSelectionView onSelect={handleSelectCourse} />}
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
