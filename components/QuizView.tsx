
import React, { useState, useMemo } from 'react';
import { Word, QuizResult } from '../types';

interface QuizViewProps {
  words: Word[];
  onComplete: (result: QuizResult) => void;
  onViewWord: (word: Word, result: QuizResult) => void;
  onCancel: () => void;
}

const QuizView: React.FC<QuizViewProps> = ({ words, onComplete, onViewWord, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [showFeedback, setShowFeedback] = useState<'correct' | 'wrong' | null>(null);

  const quizData = useMemo(() => {
    if (!words || words.length === 0) return [];
    const pool = [...words].sort(() => 0.5 - Math.random()).slice(0, 10);
    return pool.map(word => {
      const otherMeanings = words
        .filter(w => w.id !== word.id)
        .map(w => w.meaning)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      const options = [word.meaning, ...otherMeanings].sort(() => 0.5 - Math.random());
      const correctIndex = options.indexOf(word.meaning);
      return { word, options, correctIndex };
    });
  }, [words]);

  const handleAnswer = (index: number) => {
    if (showFeedback || quizData.length === 0) return;
    const isCorrect = index === quizData[currentIndex].correctIndex;
    setShowFeedback(isCorrect ? 'correct' : 'wrong');
    setTimeout(() => {
      setUserAnswers(prev => [...prev, index]);
      setShowFeedback(null);
      if (currentIndex < quizData.length - 1) setCurrentIndex(prev => prev + 1);
      else setIsFinished(true);
    }, 800);
  };

  const getResults = (): QuizResult => ({
    questions: quizData,
    userAnswers,
    score: userAnswers.reduce((acc, ans, idx) => ans === quizData[idx].correctIndex ? acc + 1 : acc, 0),
    timestamp: Date.now()
  });

  if (quizData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-white">
        <div className="glass-card p-12 md:p-20 rounded-[4rem] shadow-2xl border border-slate-100 max-w-lg w-full text-center">
          <span className="text-8xl mb-8 block animate-bounce">🏜️</span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 tracking-tighter">単語が見つかりません</h2>
          <p className="text-slate-400 font-bold mb-12 leading-relaxed">このコースを学習するには、まず単語をインポートするか、追加してください。</p>
          <button onClick={onCancel} className="w-full py-6 gradient-primary text-white rounded-[2.5rem] font-black text-xl shadow-2xl bounce-on-click">ダッシュボードへ戻る</button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const results = getResults();
    const isPerfect = results.score === quizData.length;
    return (
      <div className="min-h-screen bg-[#fdfbfb] py-16 px-6 md:px-12 animate-in zoom-in-95 duration-700 flex flex-col items-center">
        <div className="w-full max-w-4xl space-y-12">
          <div className="text-center">
            <div className="inline-block p-10 rounded-[3rem] bg-white shadow-2xl shadow-indigo-100 mb-8 transform hover:scale-110 transition duration-500">
              <span className="text-8xl">{isPerfect ? '👑' : '🎯'}</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-slate-800 mb-4 tracking-tighter">
              {isPerfect ? 'PERFECT SCORE!' : 'WELL DONE!'}
            </h2>
            <div className={`${isPerfect ? 'level-pre1-grad' : 'gradient-primary'} rounded-[3.5rem] py-12 px-10 text-white shadow-2xl shadow-indigo-200 inline-block w-full max-w-md transform hover:rotate-1 transition mt-6`}>
              <span className="text-xs font-black opacity-70 uppercase tracking-[0.3em] block mb-4">Current Session Results</span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-8xl md:text-9xl font-black tracking-tighter">{results.score}</span>
                <span className="text-3xl font-black opacity-40 mt-12">/ {quizData.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {quizData.map((q, idx) => {
              const correct = userAnswers[idx] === q.correctIndex;
              return (
                <div key={idx} onClick={() => onViewWord(q.word, results)} className="p-6 bg-white border-2 border-slate-50 rounded-[2.5rem] flex justify-between items-center hover:shadow-2xl hover:scale-[1.03] transition-all cursor-pointer group">
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${correct ? 'bg-emerald-100 text-emerald-500' : 'bg-rose-100 text-rose-500'}`}>{correct ? '✓' : '✗'}</div>
                    <div>
                      <div className="font-black text-slate-800 text-xl leading-none">{q.word.term}</div>
                      <div className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">{q.word.meaning}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => onComplete(results)} className="w-full py-8 bg-slate-900 text-white rounded-[3rem] font-black text-2xl shadow-2xl hover:bg-black transition bounce-on-click">ホーム画面へ戻る</button>
        </div>
      </div>
    );
  }

  const currentQ = quizData[currentIndex];
  const progress = ((currentIndex + 1) / quizData.length) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col pt-12 relative overflow-hidden items-center">
      {showFeedback === 'correct' && <div className="absolute inset-0 bg-emerald-500/95 z-50 flex flex-col items-center justify-center animate-in fade-in duration-300"><span className="text-[12rem] animate-bounce">✨</span><p className="text-white text-4xl font-black tracking-widest mt-8 animate-pulse">CORRECT!</p></div>}
      {showFeedback === 'wrong' && <div className="absolute inset-0 bg-rose-500/95 z-50 flex flex-col items-center justify-center animate-in fade-in duration-300"><span className="text-[12rem] animate-pulse">😰</span><p className="text-white text-4xl font-black tracking-widest mt-8">KEEP GOING!</p></div>}

      <div className="w-full max-w-4xl px-8 flex-1 flex flex-col pb-24">
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <button onClick={onCancel} className="text-slate-300 hover:text-rose-500 font-black text-sm uppercase tracking-widest transition-colors">Abort Test</button>
            <div className="px-6 py-2 gradient-primary rounded-full text-xs font-black text-white shadow-xl shadow-indigo-100 tracking-widest uppercase">Question {currentIndex + 1} of {quizData.length}</div>
          </div>
          <div className="w-full bg-slate-100 h-5 rounded-full overflow-hidden p-1.5 shadow-inner">
            <div className="gradient-primary h-full transition-all duration-700 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center text-center py-8">
          <div className="mb-8 bg-indigo-50/50 px-6 py-2.5 rounded-2xl inline-block border border-indigo-100 shadow-sm"><span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Select the correct meaning</span></div>
          <h2 className="text-6xl md:text-8xl font-black text-slate-800 tracking-tighter leading-tight mb-8 animate-in slide-in-from-bottom-8 duration-700 drop-shadow-sm">{currentQ.word.term}</h2>
          <div className="w-20 h-2 gradient-primary rounded-full shadow-xl shadow-indigo-100"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-12">
          {currentQ.options.map((option, idx) => (
            <button key={idx} onClick={() => handleAnswer(idx)} className={`w-full py-8 px-10 rounded-[3rem] text-left text-xl md:text-2xl font-black transition-all duration-300 shadow-lg border-2 bounce-on-click flex items-center justify-between group h-full ${
              showFeedback === 'correct' && idx === currentQ.correctIndex 
                ? 'bg-emerald-500 border-emerald-500 text-white translate-y-[-8px] shadow-2xl shadow-emerald-200' 
                : 'bg-white border-slate-50 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-2xl'
            }`}>
              <span>{option}</span>
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-white group-hover:scale-110 transition shadow-sm"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-indigo-500"><polyline points="9 18 15 12 9 6"></polyline></svg></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizView;
