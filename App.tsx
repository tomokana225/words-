
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

const INITIAL_WORDS: Word[] = [
  { id: 'start-1', term: 'Consequence', meaning: '結果、影響', level: EikenLevel.GRADE_2 },
  { id: 'start-2', term: 'Abundance', meaning: '豊富、大量', level: EikenLevel.GRADE_PRE_1 },
  { id: 'start-3', term: 'Diminish', meaning: '減少させる', level: EikenLevel.GRADE_2 },
  { id: 'start-4', term: 'Comprehensive', meaning: '包括的な、広範囲な', level: EikenLevel.GRADE_1 },
];

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'quiz' | 'detail' | 'import' | 'diagnosis' | 'admin' | 'level_preview'>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel | 'ALL' | 'REVIEW' | 'WEAK'>('ALL');

  // Load words from LocalStorage and then sync with Firebase
  useEffect(() => {
    const local = localStorage.getItem('eiken_ai_words');
    if (local) setWords(JSON.parse(local));
    else setWords(INITIAL_WORDS);

    const unsubscribe = onAuthChange(async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        const cloudWords = await fetchUserWords(fbUser.uid);
        if (cloudWords.length > 0) {
          setWords(prev => {
            const merged = [...prev];
            cloudWords.forEach(cw => {
              const idx = merged.findIndex(w => w.term.toLowerCase() === cw.term?.toLowerCase());
              if (idx > -1) {
                merged[idx] = { ...merged[idx], ...cw };
              } else if (cw.term) {
                merged.push({ 
                  id: `db-${Date.now()}-${Math.random()}`, 
                  term: cw.term, 
                  meaning: 'Syncing...', 
                  level: EikenLevel.GRADE_3, 
                  ...cw 
                });
              }
            });
            return merged;
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (words.length > 0) localStorage.setItem('eiken_ai_words', JSON.stringify(words));
  }, [words]);

  // Handle Spaced Repetition Notifications
  useEffect(() => {
    const timer = setInterval(() => {
      if (Notification.permission === 'granted') {
        const now = Date.now();
        const due = words.filter(w => !w.isMastered && w.nextReviewDate && w.nextReviewDate <= now);
        if (due.length >= 5) {
          new Notification('EikenMaster 学習アラート', {
            body: `復習が必要な単語が ${due.length} 件あります。記憶が新しいうちに復習しましょう！`,
            icon: 'https://cdn-icons-png.flaticon.com/512/3039/3039434.png'
          });
        }
      }
    }, 1000 * 60 * 60 * 3); // Every 3 hours
    return () => clearInterval(timer);
  }, [words]);

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
    if (user) await saveUserWordProgress(user.uid, updated);
  }, [user]);

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
            // Intervals: 1 day, 3 days, 7 days, 14 days, 30 days
            const intervals = [1, 3, 7, 14, 30];
            const days = intervals[Math.min(w.streak - 1, intervals.length - 1)];
            w.nextReviewDate = Date.now() + days * 24 * 60 * 60 * 1000;
            if (w.streak >= 5) w.isMastered = true;
          } else {
            w.streak = 0;
            w.difficultyScore = (w.difficultyScore || 0) + 15; // 苦手単語リストに自動追加
            w.nextReviewDate = Date.now() + 60 * 60 * 1000; // Review in 1 hour
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

  const handleQuickAdd = (term: string) => {
    const newWord: Word = {
      id: `quick-${Date.now()}`,
      term: term,
      meaning: '解析中...',
      level: EikenLevel.GRADE_3
    };
    setCurrentWord(newWord);
    setView('detail');
  };

  const reqNotify = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') alert('通知をオンにしました。復習タイミングでお知らせします！');
    }
  };

  const isQuiz = view === 'quiz';

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 relative">
      {!isQuiz && (
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
              { id: 'admin', label: '単語追加', icon: <path d="M12 20v-8m0 0V4m0 8h8m-8 0H4"/> },
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
            <button onClick={reqNotify} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span>通知設定</span>
            </button>
          </nav>

          <div className="pt-8 border-t border-slate-100">
             {user ? (
               <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                 <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-10 h-10 rounded-xl shadow-sm" alt="User"/>
                 <div className="overflow-hidden">
                   <p className="font-bold text-slate-700 truncate text-sm">{user.displayName}</p>
                   <button onClick={() => logout()} className="text-[10px] font-black text-rose-500 hover:underline">LOGOUT</button>
                 </div>
               </div>
             ) : (
               <button onClick={() => loginWithGoogle()} className="w-full py-4 gradient-primary text-white rounded-2xl font-black shadow-lg">Login</button>
             )}
          </div>
        </aside>
      )}

      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 md:px-12 ${isQuiz ? 'pt-0' : 'pt-8'} pb-32`}>
        {view === 'dashboard' && <Dashboard words={words} onSelectLevel={(l) => { setSelectedLevel(l as any); setView('level_preview'); }} onViewWord={(w) => { setCurrentWord(w); setView('detail'); }} onQuickAdd={handleQuickAdd} />}
        {view === 'level_preview' && <LevelWordListView level={selectedLevel as any} words={quizPool} onStartQuiz={() => setView('quiz')} onBack={() => setView('dashboard')} onViewWord={(w) => { setCurrentWord(w); setView('detail'); }} />}
        {view === 'quiz' && <QuizView words={quizPool} onComplete={(r) => { saveQuizResults(r); setView('dashboard'); }} onViewWord={(w, r) => { saveQuizResults(r); setCurrentWord(w); setView('detail'); }} onCancel={() => setView('dashboard')} />}
        {view === 'detail' && currentWord && <WordDetailView word={currentWord} onUpdate={handleUpdateWord} onBack={() => setView('dashboard')} onSelectSynonym={(t) => { handleQuickAdd(t); }} />}
        {view === 'import' && <ImportView onImport={(w) => { setWords(prev => [...prev, ...w]); setView('dashboard'); }} onCancel={() => setView('dashboard')} />}
        {view === 'diagnosis' && <DiagnosisView onCancel={() => setView('dashboard')} />}
        {view === 'admin' && <AdminView onImport={(w) => { setWords(prev => [...prev, ...w]); setView('dashboard'); }} onCancel={() => setView('dashboard')} />}
      </main>

      {!isQuiz && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-8 py-4 pb-safe flex items-center justify-between z-50">
          <button onClick={() => setView('dashboard')} className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="text-[10px] font-bold">HOME</span>
          </button>
          <button onClick={() => { setSelectedLevel('ALL'); setView('quiz'); }} className="w-14 h-14 gradient-primary rounded-2xl flex items-center justify-center text-white shadow-xl -translate-y-6 ring-8 ring-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
          <button onClick={() => setView('diagnosis')} className={`flex flex-col items-center gap-1 ${view === 'diagnosis' ? 'text-indigo-600' : 'text-slate-300'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span className="text-[10px] font-bold">診断</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
