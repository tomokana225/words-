
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
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

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
    if (selectedIdx !== null || quizData.length === 0) return;
    
    setSelectedIdx(index);
    const isCorrect = index === quizData[currentIndex].correctIndex;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    // 400ms後に次へ移動（以前より倍速）
    setTimeout(() => {
      setUserAnswers(prev => [...prev, index]);
      setSelectedIdx(null);
      setFeedback(null);
      if (currentIndex < quizData.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 400);
  };

  const getResults = (): QuizResult => ({
    questions: quizData,
    userAnswers,
    score: userAnswers.reduce((acc, ans, idx) => ans === quizData[idx].correctIndex ? acc + 1 : acc, 0),
    timestamp: Date.now()
  });

  if (quizData.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center max-w-sm w-full border border-slate-100">
          <span className="text-6xl mb-6 block">📚</span>
          <h2 className="text-2xl font-black text-slate-800 mb-2">単語が足りません</h2>
          <p className="text-slate-400 font-bold mb-8 text-sm">学習を開始するには、まずコースを選択するか単語を追加してください。</p>
          <button onClick={onCancel} className="w-full py-4 gradient-primary text-white rounded-2xl font-black shadow-lg">戻る</button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const results = getResults();
    const isPerfect = results.score === quizData.length;
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4 md:px-12 flex flex-col items-center">
        <div className="w-full max-w-3xl space-y-8 animate-in zoom-in-95 duration-500">
          <div className="bg-white p-10 rounded-[3rem] shadow-xl text-center border border-slate-100">
            <div className="text-6xl mb-4">{isPerfect ? '👑' : '🔥'}</div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
              {isPerfect ? '完璧です！' : 'お疲れ様でした！'}
            </h2>
            <div className="flex justify-center items-baseline gap-2 mt-6">
               <span className="text-8xl font-black text-indigo-600 tracking-tighter">{results.score}</span>
               <span className="text-2xl font-black text-slate-300">/ {quizData.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quizData.map((q, idx) => {
              const correct = userAnswers[idx] === q.correctIndex;
              return (
                <div key={idx} onClick={() => onViewWord(q.word, results)} className="p-5 bg-white rounded-2xl border border-slate-100 flex justify-between items-center cursor-pointer hover:shadow-lg transition">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${correct ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                      {correct ? '✓' : '✗'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{q.word.term}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{q.word.meaning}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => onComplete(results)} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-black transition">完了して戻る</button>
        </div>
      </div>
    );
  }

  const currentQ = quizData[currentIndex];
  const progress = ((currentIndex + 1) / quizData.length) * 100;

  return (
    <div className="min-h-screen bg-white flex flex-col p-4 md:p-10">
      <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <button onClick={onCancel} className="text-slate-300 hover:text-rose-500 font-black text-xs uppercase tracking-widest transition">中止</button>
            <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">Q {currentIndex + 1} / {quizData.length}</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="gradient-primary h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center">
          <h2 className="text-5xl md:text-8xl font-black text-slate-800 tracking-tighter mb-4 animate-in slide-in-from-bottom-4 duration-300">
            {currentQ.word.term}
          </h2>
          <div className="w-16 h-2 bg-indigo-600/20 rounded-full mb-12"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrectIdx = idx === currentQ.correctIndex;
              
              let btnClass = "bg-white border-2 border-slate-100 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50 shadow-sm";
              if (isSelected) {
                btnClass = feedback === 'correct' 
                  ? "bg-emerald-500 border-emerald-500 text-white scale-[1.02] shadow-emerald-200" 
                  : "bg-rose-500 border-rose-500 text-white scale-[1.02] shadow-rose-200";
              } else if (selectedIdx !== null && isCorrectIdx) {
                btnClass = "bg-emerald-100 border-emerald-200 text-emerald-700";
              }

              return (
                <button 
                  key={idx} 
                  onClick={() => handleAnswer(idx)} 
                  disabled={selectedIdx !== null}
                  className={`w-full py-6 md:py-8 px-8 rounded-[2rem] text-lg md:text-2xl font-black transition-all duration-200 shadow-md ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
