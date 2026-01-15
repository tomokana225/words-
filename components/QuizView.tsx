
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

  const results = useMemo(() => {
    if (!isFinished) return null;
    return {
      questions: quizData,
      userAnswers,
      score: userAnswers.reduce((acc, ans, idx) => ans === quizData[idx].correctIndex ? acc + 1 : acc, 0),
      timestamp: Date.now()
    };
  }, [isFinished, quizData, userAnswers]);

  if (quizData.length === 0 || (isFinished && results)) {
    if (isFinished && results) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col p-4 md:p-8 animate-view">
          <div className="w-full max-w-2xl mx-auto space-y-8 flex-1">
            <div className="bg-white rounded-[2.5rem] p-8 text-center shadow-xl border border-slate-100 space-y-4">
               <div className="text-6xl animate-bounce">🏆</div>
               <h2 className="text-3xl font-black tracking-tight text-slate-900">学習完了！</h2>
               <div className="flex items-center justify-center gap-2">
                 <p className="text-indigo-600 text-6xl font-black">{results.score}</p>
                 <span className="text-slate-300 text-2xl font-black">/ {quizData.length}</span>
               </div>
               <p className="text-slate-400 font-bold text-sm">間違えた単語を振り返りましょう</p>
            </div>

            <div className="space-y-4">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2">単語振り返りリスト</h3>
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
                 {results.questions.map((q, idx) => {
                   const isCorrect = results.userAnswers[idx] === q.correctIndex;
                   return (
                     <div 
                       key={idx} 
                       onClick={() => onViewWord(q.word, results)}
                       className="p-5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
                     >
                       <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${isCorrect ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                           {isCorrect ? '✓' : '×'}
                         </div>
                         <div>
                           <p className="font-black text-slate-800 text-base group-hover:text-indigo-600 transition">{q.word.term}</p>
                           <p className="text-[10px] text-slate-400 font-bold">{q.word.meaning}</p>
                         </div>
                       </div>
                       <div className="text-right">
                         {!isCorrect && (
                           <p className="text-[10px] font-black text-rose-400 mb-1">Miss: {q.options[results.userAnswers[idx]]}</p>
                         )}
                         <p className="text-[10px] font-black text-emerald-500">Correct: {q.word.meaning}</p>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>

            <button 
              onClick={() => onComplete(results)} 
              className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-xl hover:bg-black transition-all bounce-on-click"
            >
              ダッシュボードに戻る
            </button>
          </div>
          <div className="h-12 flex items-center justify-center opacity-20 mt-4">
             <p className="text-[9px] font-black uppercase tracking-[0.4em]">Review Mode Enabled</p>
          </div>
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
            <button onClick={onCancel} className="hover:text-rose-500 transition">Quit Quiz</button>
            <span>Question {currentIndex + 1} / {quizData.length}</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-12">
          <div className="space-y-4">
            <span className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">Analyze Term</span>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">
              {currentQ.word.term}
            </h2>
            <div className="h-1 w-12 bg-indigo-100 rounded-full mx-auto"></div>
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
                  className={`w-full py-5 px-6 rounded-2xl text-base md:text-lg font-black transition-all duration-200 bounce-on-click ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-20 flex items-center justify-center">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">EikenMaster AI Core Study</p>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
