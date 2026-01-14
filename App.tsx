import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { EikenLevel, Word, QuizResult } from './types';
import Dashboard from './components/Dashboard';
import QuizView from './components/QuizView';
import WordDetailView from './components/WordDetailView';
import ImportView from './components/ImportView';
import DiagnosisView from './components/DiagnosisView';
import AdminView from './components/AdminView';
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
  const [view, setView] = useState<'dashboard' | 'quiz' | 'detail' | 'import' | 'diagnosis' | 'admin'>('dashboard');
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
            // SRS Logic: 1 day -> 3 days -> 7 days -> 14 days -> 30 days -> Mastery
            const intervals = [1, 3, 7, 14, 30];
            const nextIdx = Math.min(target.streak - 1, intervals.length - 1);
            const intervalDays = intervals[nextIdx];
            
            target.nextReviewDate = Date.now() + (intervalDays * 86400000);
            if (target.streak >= 5) target.isMastered = true;
          } else {
            target.streak = 0;
            target.difficultyScore = (target.difficultyScore || 0) + 10;
            target.nextReviewDate = Date.now() + 3600000; // 1 hour later for review
            target.isMastered = false;
          }
          
          updatedWords[wordIdx] = target;
          updatedBatch.push(target);
        }
      });
      return updatedWords;
    });

    if (user) {
      for (const w of updatedBatch) await saveUserWordProgress(user.uid, w);
    }
  }, [user]);

  // Added useMemo to React imports to solve line 114 error
  const quizPool = useMemo(() => {
    if (selectedLevel === 'REVIEW') {
      const now = Date.now();
      return words.filter(w => w.nextReviewDate && w.nextReviewDate <= now && !w.isMastered);
    }
    if (selectedLevel === 'ALL') return words;
    return words.filter(w => w.level === selectedLevel);
  }, [words, selectedLevel]);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative bg-slate-50 shadow-2xl">
      {view !== 'quiz' && (
        <header className="px-6 pt-8 pb-4 flex items-center justify-between bg-white/50 backdrop-blur-md sticky top-0 z-40">
          <div onClick={() => setView('dashboard')} className="cursor-pointer">
            <h1 className="text-2xl font-black text-indigo-600 tracking-tight flex items-center gap-2">
              <span className="p-1.5 gradient-primary text-white rounded-xl shadow-lg shadow-indigo-200">
                <svg xmlns="http://www.w3.org/2000/round" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              </span>
              EikenMaster
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button onClick={() => logout()} className="w-10 h-10 rounded-full border-2 border-indigo-100 overflow-hidden">
                <img src={user.photoURL || ''} alt="User" className="w-full h-full object-cover" />
              </button>
            ) : (
              <button onClick={() => loginWithGoogle()} className="p-2 bg-indigo-50 text-indigo-600 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </button>
            )}
            <button onClick={() => setView('admin')} className="p-2 bg-slate-100 text-slate-500 rounded-full">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </button>
          </div>
        </header>
      )}

      <main className={`flex-1 overflow-y-auto px-6 ${view === 'quiz' ? 'pt-0' : 'pt-2'} pb-32`}>
        {view === 'dashboard' && <Dashboard words={words} onStartQuiz={(lvl) => { setSelectedLevel(lvl); setView('quiz'); }} onViewWord={(w) => { setCurrentWord(w); setView('detail'); }} />}
        {view === 'quiz' && <QuizView words={quizPool} onComplete={(r) => { saveQuizResults(r); setView('dashboard'); }} onViewWord={(w, r) => { saveQuizResults(r); setCurrentWord(w); setView('detail'); }} onCancel={() => setView('dashboard')} />}
        {view === 'detail' && currentWord && <WordDetailView word={currentWord} onUpdate={handleUpdateWord} onBack={() => setView('dashboard')} onSelectSynonym={(t) => { const e = words.find(w => w.term.toLowerCase() === t.toLowerCase()); setCurrentWord(e || { id: `temp-${Date.now()}`, term: t, meaning: '解析中...', level: EikenLevel.GRADE_3 }); }} />}
        {view === 'import' && <ImportView onImport={(w) => { setWords(prev => [...prev, ...w]); setView('dashboard'); }} onCancel={() => setView('dashboard')} />}
        {view === 'diagnosis' && <DiagnosisView onCancel={() => setView('dashboard')} />}
        {view === 'admin' && <AdminView onImport={(w) => { setWords(prev => [...prev, ...w]); setView('dashboard'); }} onCancel={() => setView('dashboard')} />}
      </main>

      {view !== 'quiz' && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-3 pb-safe flex items-center justify-between z-50 rounded-t-[2.5rem] shadow-2xl">
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 transition ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={view === 'dashboard' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">ホーム</span>
          </button>
          <button onClick={() => { setSelectedLevel('ALL'); setView('quiz'); }} className="flex flex-col items-center -translate-y-6">
            <div className="w-14 h-14 gradient-primary rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-300 ring-4 ring-white active:scale-90 transition transform">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <span className="text-[10px] font-black text-indigo-600 mt-2 uppercase tracking-widest">学習開始</span>
          </button>
          <button onClick={() => setView('diagnosis')} className={`flex flex-col items-center gap-1 transition ${view === 'diagnosis' ? 'text-indigo-600' : 'text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">診断</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;