
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

    setTimeout(() => {
      setUserAnswers(prev => [...prev, index]);
      setSelectedIdx(null);
      setFeedback(null);
      if (currentIndex < quizData.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 450);
  };

  if (quizData.length === 0 || isFinished) {
    // 終了処理は省略せず、既存のロジックをリファインして維持
    if (isFinished) {
      const results = {
        questions: quizData,
        userAnswers,
        score: userAnswers.reduce((acc, ans, idx) => ans === quizData[idx].correctIndex ? acc + 1 : acc, 0),
        timestamp: Date.now()
      };
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 space-y-12 animate-subtle">
          <div className="text-center space-y-4">
             <div className="text-6xl">🏁</div>
             <h2 className="text-3xl font-bold tracking-tight text-slate-900">学習完了！</h2>
             <p className="text-indigo-600 text-6xl font-bold">{results.score}<span className="text-slate-300 text-2xl font-medium"> / {quizData.length}</span></p>
          </div>
          <button onClick={() => onComplete(results)} className="w-full max-w-sm py-4 bg-slate-900 text-white rounded-xl font-bold text-lg shadow-lg">
            ダッシュボードに戻る
          </button>
        </div>
      );
    }
    return null;
  }

  const currentQ = quizData[currentIndex];
  const progress = ((currentIndex + 1) / quizData.length) * 100;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <button onClick={onCancel} className="hover:text-rose-500 transition">Quit</button>
            <span>Progress: {currentIndex + 1} / {quizData.length}</span>
          </div>
          <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-12">
          <div className="space-y-2">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em]">English Word</span>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight">
              {currentQ.word.term}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 gap-3 w-full">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrectIdx = idx === currentQ.correctIndex;
              
              let btnClass = "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50 shadow-sm";
              if (isSelected) {
                btnClass = feedback === 'correct' 
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200" 
                  : "bg-rose-500 border-rose-500 text-white shadow-rose-200";
              } else if (selectedIdx !== null && isCorrectIdx) {
                btnClass = "bg-emerald-50 border-emerald-200 text-emerald-700";
              }

              return (
                <button 
                  key={idx} 
                  onClick={() => handleAnswer(idx)} 
                  disabled={selectedIdx !== null}
                  className={`w-full py-5 px-6 rounded-2xl text-base md:text-lg font-semibold transition-all duration-200 bounce-on-click ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-20 flex items-center justify-center">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">EikenMaster AI Study Mode</p>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
