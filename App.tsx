
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { EikenLevel, Word, QuizResult, UserStats, MasteryStatus, QuizType } from './types';
import Dashboard from './components/Dashboard';
import QuizView from './components/QuizView';
import WordDetailView from './components/WordDetailView';
import DiagnosisView from './components/DiagnosisView';
import AdminView from './components/AdminView';
import LevelWordListView from './components/LevelWordListView';
import CourseSelectionView from './components/CourseSelectionView';
import WelcomeView from './components/WelcomeView';
import MyPageView from './components/MyPageView';
import ShopView from './components/ShopView';
import { 
  initializeFirebase,
  onAuthChange, 
  loginWithGoogle, 
  logout, 
  fetchUserWords, 
  fetchGlobalWords,
  saveUserWordProgress,
  saveWordToDB,
  getAdminEmail
} from './services/firebaseService';
import { User } from 'firebase/auth';

const App: React.FC = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const [view, setView] = useState<'welcome' | 'dashboard' | 'wordbook' | 'diagnosis' | 'mypage' | 'quiz' | 'detail' | 'admin' | 'level_preview' | 'shop'>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel | 'ALL' | 'REVIEW' | 'WEAK' | MasteryStatus>('ALL');
  const [quizConfig, setQuizConfig] = useState<{ type: QuizType | 'random', count: number, soundEnabled: boolean }>({ 
    type: 'random', 
    count: 10,
    soundEnabled: true 
  });
  const [activeQuizResult, setActiveQuizResult] = useState<QuizResult | null>(null); // クイズ結果を保持
  const [history, setHistory] = useState<string[]>(['dashboard']);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  const [stats, setStats] = useState<UserStats>({
    xp: 0,
    coins: 500,
    level: 1,
    totalStudyTime: 0,
    unlockedItems: ['default-avatar'],
    activeAvatar: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Felix'
  });

  const isAdmin = useMemo(() => {
    const adminEmail = getAdminEmail();
    return user?.email && adminEmail && user.email === adminEmail;
  }, [user]);

  const navigateTo = useCallback((newView: any) => {
    setHistory(prev => [...prev, newView]);
    setView(newView);
    if (newView !== 'quiz') {
      window.history.pushState({ view: newView }, '', '');
    }
  }, []);

  const resetToDashboard = useCallback(() => {
    setHistory(['dashboard']);
    setView('dashboard');
    setActiveQuizResult(null); // ホームに戻る時はリセット
    window.history.replaceState({ view: 'dashboard' }, '', '/');
  }, []);

  const goBack = useCallback(() => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const prevView = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      setView(prevView as any);
    } else {
      resetToDashboard();
    }
  }, [history, resetToDashboard]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (view === 'quiz') {
        goBack();
      } else if (e.state?.view) {
        setView(e.state.view);
      } else {
        resetToDashboard();
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view, goBack, resetToDashboard]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      if (view === 'quiz' || view === 'welcome') return;
      if (touchStartX.current < 60 && deltaX > 100 && Math.abs(deltaY) < 60) {
        goBack();
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [view, goBack]);

  const refreshWords = useCallback(async (currentUser: User | null) => {
    const globals = await fetchGlobalWords();
    if (currentUser) {
      const userProgress = await fetchUserWords(currentUser.uid);
      const merged = globals.map(gw => {
        const progress = userProgress.find(uw => uw.term.toLowerCase() === gw.term.toLowerCase());
        return progress ? { ...gw, ...progress } : gw;
      });
      setWords(merged);
      const masteredCount = merged.filter(w => (w.masteryCount || 0) >= 4).length;
      setStats(prev => ({
        ...prev,
        xp: masteredCount * 100 + (merged.length * 10),
        level: Math.floor(Math.sqrt((masteredCount * 100) / 100)) + 1,
      }));
    } else {
      setWords(globals);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeFirebase();
      const unsubscribe = onAuthChange(async (fbUser) => {
        setUser(fbUser);
        await refreshWords(fbUser);
        if (fbUser || localStorage.getItem('eiken_mock_user')) {
          if (view === 'welcome') resetToDashboard();
        } else {
          setView('welcome');
        }
        setIsAppReady(true);
      });
      return () => unsubscribe();
    };
    init();
  }, [refreshWords, resetToDashboard]);

  const grantRewards = useCallback((newWords: Word[]) => {
    let earnedCoins = 0;
    let earnedXp = 0;
    newWords.forEach(w => {
      const isNewlyMastered = (w.masteryCount || 0) >= 4 && !w.rewardClaimed;
      if (isNewlyMastered) {
        earnedCoins += 100;
        earnedXp += 200;
        w.rewardClaimed = true;
        w.isMastered = true;
      } else {
        earnedXp += 15;
      }
    });
    if (earnedCoins > 0 || earnedXp > 0) {
      setStats(prev => ({
        ...prev,
        xp: prev.xp + earnedXp,
        coins: prev.coins + earnedCoins,
        level: Math.floor(Math.sqrt((prev.xp + earnedXp) / 100)) + 1
      }));
    }
  }, []);

  const handleUpdateWord = useCallback(async (updated: Word) => {
    setWords(prev => {
      const idx = prev.findIndex(w => w.term.toLowerCase() === updated.term.toLowerCase());
      const copy = [...prev];
      if (idx > -1) {
        copy[idx] = { ...copy[idx], ...updated };
      } else {
        copy.push(updated);
      }
      grantRewards([updated]);
      return copy;
    });
    if (user) await saveUserWordProgress(user.uid, updated);
  }, [user, grantRewards]);

  const saveQuizResults = useCallback(async (results: QuizResult) => {
    const updatedBatch: Word[] = [];
    setWords(prev => {
      const nextWords = [...prev];
      results.questions.forEach((q, i) => {
        const idx = nextWords.findIndex(w => w.term.toLowerCase() === q.word.term.toLowerCase());
        if (idx > -1) {
          const w = { ...nextWords[idx] };
          const isCorrect = results.userAnswers[i] === q.correctIndex;
          
          if (isCorrect) {
            w.masteryCount = (w.masteryCount || 0) + 1;
            w.streak = (w.streak || 0) + 1;
            w.lastWasCorrect = true;
            w.difficultyScore = Math.max(0, (w.difficultyScore || 0) - 10);
            
            const intervals = [0.5, 1, 3, 7, 14, 30];
            const days = intervals[Math.min(w.masteryCount, intervals.length - 1)];
            w.nextReviewDate = Date.now() + days * 24 * 60 * 60 * 1000;
            
            if (w.masteryCount >= 4) w.isMastered = true;
          } else {
            w.streak = 0;
            w.lastWasCorrect = false;
            w.difficultyScore = (w.difficultyScore || 0) + 20;
            w.nextReviewDate = Date.now() + 15 * 60 * 1000;
            w.isMastered = false;
            w.masteryCount = Math.max(0, (w.masteryCount || 0) - 1);
          }
          nextWords[idx] = w;
          updatedBatch.push(w);
        }
      });
      grantRewards(updatedBatch);
      return nextWords;
    });
    if (user) {
      for (const w of updatedBatch) await saveUserWordProgress(user.uid, w);
    }
  }, [user, grantRewards]);

  const getMasteryStatus = (w: Word): MasteryStatus => {
    if ((w.masteryCount || 0) >= 4) return MasteryStatus.MASTERED;
    if (w.lastWasCorrect === false || (w.difficultyScore || 0) > 30) return MasteryStatus.WEAK;
    if ((w.masteryCount || 0) > 0) return MasteryStatus.UNSTABLE;
    return MasteryStatus.UNLEARNED;
  };

  const quizPool = useMemo(() => {
    const now = Date.now();
    if (selectedLevel === 'REVIEW') return words.filter(w => (w.masteryCount || 0) < 4 && w.nextReviewDate && w.nextReviewDate <= now);
    if (selectedLevel === 'WEAK') return words.filter(w => getMasteryStatus(w) === MasteryStatus.WEAK);
    if (selectedLevel === MasteryStatus.UNLEARNED) return words.filter(w => getMasteryStatus(w) === MasteryStatus.UNLEARNED);
    if (selectedLevel === MasteryStatus.UNSTABLE) return words.filter(w => getMasteryStatus(w) === MasteryStatus.UNSTABLE);
    if (selectedLevel === MasteryStatus.MASTERED) return words.filter(w => getMasteryStatus(w) === MasteryStatus.MASTERED);
    if (selectedLevel === 'ALL') return words;
    return words.filter(w => w.level === selectedLevel);
  }, [words, selectedLevel]);

  if (!isAppReady) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center font-sans">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-medium text-slate-500 text-sm">AIエンジン起動中...</p>
      </div>
    );
  }

  const hideNav = view === 'quiz' || view === 'welcome' || view === 'diagnosis';
  const isNoScrollView = view === 'dashboard' || view === 'quiz';

  const navItems = [
    { id: 'dashboard', label: 'ホーム', icon: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> },
    { id: 'wordbook', label: '単語帳', icon: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/> },
    { id: 'shop', label: 'ショップ', icon: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></> },
    { id: 'diagnosis', label: '診断', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
    { id: 'mypage', label: '記録', icon: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/> },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-700 overflow-hidden">
      {!hideNav && (
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 py-10 px-6 h-screen sticky top-0 z-50">
          <div className="mb-10 px-2 cursor-pointer" onClick={() => resetToDashboard()}>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <div className="w-6 h-6 gradient-primary rounded-md"></div>
              EikenMaster AI
            </h1>
          </div>
          <nav className="flex-1 space-y-1">
            {navItems.map(item => (
              <button 
                key={item.id}
                onClick={() => navigateTo(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${view === item.id || (item.id === 'wordbook' && view === 'level_preview') ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          {isAdmin && (
             <button onClick={() => navigateTo('admin')} className="mt-auto px-4 py-2 text-[10px] font-bold text-slate-400 border border-dashed rounded-lg hover:border-indigo-400 hover:text-indigo-400 transition">管理モード</button>
          )}
        </aside>
      )}

      {!hideNav && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 flex items-center justify-around p-2 z-[100] pb-safe shadow-lg">
           {navItems.map(item => (
             <button 
               key={item.id}
               onClick={() => navigateTo(item.id as any)} 
               className={`flex flex-col items-center gap-1 p-2 min-w-[60px] transition-all ${view === item.id || (item.id === 'wordbook' && view === 'level_preview') ? 'text-indigo-600' : 'text-slate-400'}`}
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
               <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
             </button>
           ))}
        </nav>
      )}

      <main className={`flex-1 w-full max-w-4xl mx-auto px-4 lg:px-8 ${hideNav ? 'pt-0' : 'pt-6 lg:pt-10'} ${isNoScrollView ? 'h-screen overflow-hidden' : 'pb-24 overflow-y-auto h-screen custom-scrollbar'} relative`}>
        <div className={`animate-view ${isNoScrollView ? 'h-full flex flex-col' : ''}`}>
          {view === 'welcome' && <WelcomeView onLogin={loginWithGoogle} onGuest={() => resetToDashboard()} />}
          {view === 'dashboard' && <Dashboard user={user} stats={stats} words={words} onSelectLevel={(l) => { setSelectedLevel(l as any); navigateTo('level_preview'); }} onViewWord={(w) => { setCurrentWord(w); navigateTo('detail'); }} onGoShop={() => navigateTo('shop')} />}
          {/* Fix: Replaced undefined variable 'onBack' with 'goBack' */}
          {view === 'wordbook' && <CourseSelectionView onSelect={(l) => { setSelectedLevel(l); navigateTo('level_preview'); }} onLogin={loginWithGoogle} onBack={goBack} />}
          {view === 'diagnosis' && <DiagnosisView onCancel={goBack} />}
          {view === 'mypage' && <MyPageView user={user} stats={stats} words={words} onLogout={logout} onLogin={loginWithGoogle} onAdmin={() => navigateTo('admin')} isAdmin={isAdmin} onBack={goBack} onSelectItem={(id) => setStats(prev => ({...prev, activeAvatar: id}))} />}
          {view === 'shop' && <ShopView stats={stats} onPurchase={(item) => { setStats(prev => ({ ...prev, coins: prev.coins - item.price, unlockedItems: [...prev.unlockedItems, item.id] })); }} onGacha={(items) => { setStats(prev => ({ ...prev, coins: prev.coins - 300, unlockedItems: [...prev.unlockedItems, ...items.map(i => i.id)] })); }} onBack={goBack} />}
          {view === 'level_preview' && <LevelWordListView level={selectedLevel as any} words={quizPool} onStartQuiz={(config) => { setActiveQuizResult(null); setQuizConfig(config); navigateTo('quiz'); }} onBack={goBack} onViewWord={(w) => { setCurrentWord(w); navigateTo('detail'); }} />}
          {view === 'quiz' && <QuizView words={quizPool} config={quizConfig} initialResult={activeQuizResult} onComplete={(r) => { saveQuizResults(r); resetToDashboard(); }} onViewWord={(w, r) => { saveQuizResults(r); setActiveQuizResult(r); setCurrentWord(w); navigateTo('detail'); }} onCancel={goBack} />}
          {view === 'detail' && currentWord && <WordDetailView word={currentWord} allWords={words} onUpdate={handleUpdateWord} onBack={goBack} onSelectSynonym={(t) => { 
            const found = words.find(w => w.term.toLowerCase() === t.toLowerCase());
            if (found) setCurrentWord(found);
          }} />}
          {view === 'admin' && isAdmin && (
            <AdminView 
              onImport={async (ws) => { 
                for (const w of ws) await saveWordToDB(w);
                await refreshWords(user);
              }} 
              onCancel={goBack} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
