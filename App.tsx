
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EikenLevel, Word, QuizResult } from './types';
import Dashboard from './components/Dashboard';
import QuizView from './components/QuizView';
import WordDetailView from './components/WordDetailView';
import ImportView from './components/ImportView';
import DiagnosisView from './components/DiagnosisView';
import AdminView from './components/AdminView';
import LevelWordListView from './components/LevelWordListView';
import { 
  onAuthChange, 
  loginWithGoogle, 
  logout, 
  fetchUserWords, 
  saveUserWordProgress 
} from './services/firebaseService';
import { User } from 'firebase/auth';

const DEFAULT_WORDS: Word[] = [
  { id: '1', term: 'Environment', meaning: '環境', level: EikenLevel.GRADE_2 },
  { id: '2', term: 'Significant', meaning: '重要な', level: EikenLevel.GRADE_PRE_1 },
  { id: '3', term: 'Accomplish', meaning: '成し遂げる', level: EikenLevel.GRADE_2 },
  { id: '4', term: 'Sufficient', meaning: '十分な', level: EikenLevel.GRADE_PRE_1 },
  { id: '5', term: 'Inhabit', meaning: '住む', level: EikenLevel.GRADE_2 },
];

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'quiz' | 'detail' | 'import' | 'diagnosis' | 'admin' | 'level_preview'>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel | 'ALL' | 'REVIEW'>('ALL');

  useEffect(() => {
    const saved = localStorage.getItem('eiken_master_words');
    if (saved) setWords(JSON.parse(saved));
    else setWords(DEFAULT_WORDS);

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const dbWords = await fetchUserWords(firebaseUser.uid);
        if (dbWords.length > 0) {
          setWords(prev => {
            const merged = [...prev];
            dbWords.forEach(dbW => {
              const idx = merged.findIndex(w => w.term.toLowerCase() === dbW.term?.toLowerCase());
              if (idx > -1) merged[idx] = { ...merged[idx], ...dbW };
              else if (dbW.term) merged.push({ id: `db-${Date.now()}`, term: dbW.term, meaning: 'ロード中...', level: EikenLevel.GRADE_3, ...dbW });
            });
            return merged;
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (words.length > 0) localStorage.setItem('eiken_master_words', JSON.stringify(words));
  }, [words]);

  const handleUpdateWord = useCallback(async (updatedWord: Word) => {
    setWords(prev => {
      const idx = prev.findIndex(w => w.id === updatedWord.id || w.term === updatedWord.term);
      if (idx > -1) {
        const newWords = [...prev];
        newWords[idx] = updatedWord;
        return newWords;
      }
      return [...prev, updatedWord];
    });
    if (user) await saveUserWordProgress(user.uid, updatedWord);
  }, [user]);

  const saveQuizResults = useCallback(async (results: QuizResult) => {
    const updatedBatch: Word[] = [];
    setWords(prevWords => {
      const updatedWords = [...prevWords];
      results.questions.forEach((q, idx) => {
        const wordIdx = updatedWords.findIndex(w => w.id === q.word.id);
        if (wordIdx > -1) {
          const isCorrect = results.userAnswers[idx] === q.correctIndex;
          const target = { ...updatedWords[wordIdx] };
          if (isCorrect) {
            target.streak = (target.streak || 0) + 1;
            const intervals = [1, 3, 7, 14, 30];
            const nextIdx = Math.min(target.streak - 1, intervals.length - 1);
            target.nextReviewDate = Date.now() + (intervals[nextIdx] * 86400000);
            if (target.streak >= 5) target.isMastered = true;
          } else {
            target.streak = 0;
            target.difficultyScore = (target.difficultyScore || 0) + 10;
            target.nextReviewDate = Date.now() + 3600000;
            target.isMastered = false;
          }
          updatedWords[wordIdx] = target;
          updatedBatch.push(target);
        }
      });
      return updatedWords;
    });
    if (user) for (const w of updatedBatch) await saveUserWordProgress(user.uid, w);
  }, [user]);

  const quizPool = useMemo(() => {
    if (selectedLevel === 'REVIEW') {
      const now = Date.now();
      return words.filter(w => w.nextReviewDate && w.nextReviewDate <= now && !w.isMastered);
    }
    if (selectedLevel === 'ALL') return words;
    return words.filter(w => w.level === selectedLevel);
  }, [words, selectedLevel]);

  const isQuizView = view === 'quiz';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full -z-10 animate-pulse"></div>
      <div className="fixed bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-rose-200/20 blur-[120px] rounded-full -z-10 animate-pulse delay-1000"></div>

      {/* PC Side Navigation */}
      {!isQuizView && (
        <aside className="hidden md:flex w-64 lg:w-72 flex-col bg-white/70 backdrop-blur-xl border-r border-slate-100 p-8 sticky top-0 h-screen z-50">
          <div onClick={() => setView('dashboard')} className="cursor-pointer mb-12">
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3">
              <span className="w-10 h-10 gradient-primary text-white rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center transform -rotate-6">
                <svg xmlns="http://www.w3.org/2000/round" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">EikenMaster</span>
            </h1>
          </div>

          <nav className="flex-1 space-y-4">
            <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>ホーム</span>
            </button>
            <button onClick={() => setView('diagnosis')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition ${view === 'diagnosis' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>レベル診断</span>
            </button>
            <button onClick={() => setView('admin')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black transition ${view === 'admin' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-indigo-50 hover:text-indigo-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20v-8m0 0V4m0 8h8m-8 0H4"/></svg>
              <span>単語追加</span>
            </button>
          </nav>

          <div className="pt-8 mt-8 border-t border-slate-100">
             {user ? (
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                 <img src={user.photoURL || ''} alt="User" className="w-12 h-12 rounded-xl border-2 border-white shadow-sm" />
                 <div className="overflow-hidden">
                   <p className="font-black text-slate-700 truncate text-sm">{user.displayName}</p>
                   <button onClick={() => logout()} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Logout</button>
                 </div>
               </div>
             ) : (
               <button onClick={() => loginWithGoogle()} className="w-full py-4 gradient-primary text-white rounded-2xl font-black shadow-lg shadow-indigo-100">Login</button>
             )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full relative">
        {!isQuizView && (
          <header className="md:hidden px-6 pt-10 pb-6 flex items-center justify-between sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/40">
            <div onClick={() => setView('dashboard')} className="cursor-pointer">
              <h1 className="text-xl font-black tracking-tighter flex items-center gap-2">
                <span className="w-8 h-8 gradient-primary text-white rounded-xl shadow-lg flex items-center justify-center transform -rotate-6">
                  <svg xmlns="http://www.w3.org/2000/round" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                </span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">EikenMaster</span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <button onClick={() => logout()} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-md">
                  <img src={user.photoURL || ''} alt="User" className="w-full h-full object-cover" />
                </button>
              )}
              <button onClick={() => setView('admin')} className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20v-8m0 0V4m0 8h8m-8 0H4"/></svg>
              </button>
            </div>
          </header>
        )}

        <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 ${isQuizView ? 'pt-0' : 'pt-6'} pb-32`}>
          {view === 'dashboard' && <Dashboard words={words} onSelectLevel={(lvl) => { setSelectedLevel(lvl); setView('level_preview'); }} onViewWord={(w) => { setCurrentWord(w); setView('detail'); }} />}
          {view === 'level_preview' && <LevelWordListView level={selectedLevel} words={quizPool} onStartQuiz={() => setView('quiz')} onBack={() => setView('dashboard')} onViewWord={(w) => { setCurrentWord(w); setView('detail'); }} />}
          {view === 'quiz' && <QuizView words={quizPool} onComplete={(r) => { saveQuizResults(r); setView('dashboard'); }} onViewWord={(w, r) => { saveQuizResults(r); setCurrentWord(w); setView('detail'); }} onCancel={() => setView('dashboard')} />}
          {/* Fixed line below: Use selectedLevel comparison to determine back destination instead of impossible current view comparison */}
          {view === 'detail' && currentWord && <WordDetailView word={currentWord} onUpdate={handleUpdateWord} onBack={() => setView(selectedLevel !== 'ALL' ? 'level_preview' : 'dashboard')} onSelectSynonym={(t) => { const e = words.find(w => w.term.toLowerCase() === t.toLowerCase()); setCurrentWord(e || { id: `temp-${Date.now()}`, term: t, meaning: '解析中...', level: EikenLevel.GRADE_3 }); }} />}
          {view === 'import' && <ImportView onImport={(w) => { setWords(prev => [...prev, ...w]); setView('dashboard'); }} onCancel={() => setView('dashboard')} />}
          {view === 'diagnosis' && <DiagnosisView onCancel={() => setView('dashboard')} />}
          {view === 'admin' && <AdminView onImport={(w) => { setWords(prev => [...prev, ...w]); setView('dashboard'); }} onCancel={() => setView('dashboard')} />}
        </main>

        {/* Mobile Botton Navigation */}
        {!isQuizView && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-2xl border-t border-white/50 px-8 py-4 pb-safe flex items-center justify-between z-50 rounded-t-[3rem] shadow-2xl">
            <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'dashboard' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={view === 'dashboard' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="3"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span className="text-[10px] font-black uppercase tracking-tighter">ホーム</span>
            </button>
            <button onClick={() => { setSelectedLevel('ALL'); setView('quiz'); }} className="flex flex-col items-center -translate-y-6">
              <div className="w-16 h-16 gradient-primary rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-300 ring-8 ring-white active:scale-90 transition transform">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
            </button>
            <button onClick={() => setView('diagnosis')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'diagnosis' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={view === 'diagnosis' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span className="text-[10px] font-black uppercase tracking-tighter">診断</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};

export default App;
