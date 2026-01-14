
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
      const nextAnswers = [...userAnswers, index];
      setUserAnswers(nextAnswers);
      setShowFeedback(null);

      if (currentIndex < quizData.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsFinished(true);
      }
    }, 600);
  };

  const getResults = (): QuizResult => ({
    questions: quizData,
    userAnswers,
    score: userAnswers.reduce((acc, ans, idx) => ans === quizData[idx].correctIndex ? acc + 1 : acc, 0),
    timestamp: Date.now()
  });

  if (quizData.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-sm">
          <span className="text-6xl mb-6 block">🤔</span>
          <h2 className="text-2xl font-black text-slate-800 mb-2">単語が見つかりません</h2>
          <p className="text-slate-500 font-bold mb-8">このレベルにはまだ単語が登録されていないようです。</p>
          <button 
            onClick={onCancel}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 bounce-on-click"
          >
            もどる
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const results = getResults();

    return (
      <div className="min-h-screen bg-slate-50 pt-12 pb-20 px-6 animate-in zoom-in-95 duration-500 overflow-y-auto">
        <div className="text-center mb-10">
          <div className="inline-block p-6 rounded-full bg-white shadow-xl shadow-indigo-100 mb-6">
            <span className="text-6xl">🎉</span>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-2">クイズかんりょう！</h2>
          <p className="text-slate-400 font-bold mb-6">おつかれさまでした ✨</p>
          
          <div className="bg-indigo-600 rounded-[2.5rem] py-8 px-10 text-white shadow-2xl shadow-indigo-200 inline-block w-full">
            <span className="text-sm font-bold opacity-70 uppercase tracking-widest block mb-1">あなたのスコア</span>
            <span className="text-6xl font-black">{results.score}</span>
            <span className="text-2xl font-bold opacity-50"> / {quizData.length}</span>
          </div>
        </div>

        <div className="space-y-4 mb-10">
          <h3 className="font-black text-slate-400 uppercase tracking-widest text-[10px] px-2">正誤チェック（タップで詳細を表示）</h3>
          <div className="grid gap-3">
            {quizData.map((q, idx) => (
              <div 
                key={idx} 
                onClick={() => onViewWord(q.word, results)}
                className={`p-5 rounded-3xl border-2 flex justify-between items-center transition cursor-pointer hover:shadow-md active:scale-95 transform ${
                  userAnswers[idx] === q.correctIndex ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-200' : 'bg-rose-50 border-rose-100 hover:border-rose-200'
                }`}
              >
                <div>
                  <div className="font-black text-slate-800 flex items-center gap-2">
                    {q.word.term}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-30"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                  </div>
                  <div className="text-xs font-bold opacity-60">
                    正解: {q.word.meaning}
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${
                  userAnswers[idx] === q.correctIndex ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  {userAnswers[idx] === q.correctIndex ? '✓' : '✗'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => onComplete(results)}
          className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-slate-200 bounce-on-click active:scale-95 transition"
        >
          ホームにもどる
        </button>
      </div>
    );
  }

  const currentQ = quizData[currentIndex];
  const progress = ((currentIndex + 1) / quizData.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-12">
      {/* Progress Bar Header */}
      <div className="px-6 mb-8">
        <div className="flex justify-between items-center mb-3">
          <button onClick={onCancel} className="text-slate-400 font-black text-sm uppercase">やめる</button>
          <div className="px-3 py-1 bg-white rounded-full text-[10px] font-black text-indigo-500 border border-indigo-50 tracking-widest">
            {currentIndex + 1} / {quizData.length}
          </div>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden shadow-inner">
          <div 
            className="bg-indigo-500 h-full transition-all duration-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      <div className="flex-1 px-6 flex flex-col">
        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center py-10 relative">
          {showFeedback === 'correct' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 animate-ping pointer-events-none">
              <span className="text-8xl">✅</span>
            </div>
          )}
          {showFeedback === 'wrong' && (
            <div className="absolute inset-0 flex items-center justify-center z-10 animate-bounce pointer-events-none">
              <span className="text-8xl">❌</span>
            </div>
          )}
          
          <h2 className="text-5xl font-black text-slate-800 tracking-tight mb-4 drop-shadow-sm">{currentQ.word.term}</h2>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">この単語の意味は？</p>
        </div>

        {/* Options Area */}
        <div className="grid grid-cols-1 gap-4 pb-12">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              className={`w-full py-5 px-8 rounded-[2rem] text-left text-lg font-black transition-all shadow-sm border-2 bounce-on-click ${
                showFeedback === 'correct' && idx === currentQ.correctIndex 
                  ? 'bg-emerald-500 border-emerald-500 text-white translate-y-[-4px] shadow-lg shadow-emerald-200' 
                  : showFeedback === 'wrong' && idx === currentQ.correctIndex
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                  : 'bg-white border-slate-100 text-slate-700 active:bg-slate-50'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuizView;
