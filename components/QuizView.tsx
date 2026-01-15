
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
        <div className="h-full bg-slate-50 flex flex-col p-4 md:p-6 animate-view overflow-hidden">
          <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col min-h-0 gap-4">
            {/* Header Area (Compact) */}
            <div className="bg-white rounded-[2rem] p-4 flex items-center justify-between shadow-sm border border-slate-100 flex-shrink-0">
               <div className="flex items-center gap-4">
                 <button 
                   onClick={() => onComplete(results)}
                   className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition bounce-on-click"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"></polyline></svg>
                 </button>
                 <div className="text-4xl animate-bounce">🏆</div>
                 <div className="text-left">
                   <h2 className="text-xl font-black tracking-tight text-slate-900">学習完了！</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Great Progress</p>
                 </div>
               </div>
               <div className="flex items-center gap-1 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
                 <p className="text-indigo-600 text-3xl font-black">{results.score}</p>
                 <span className="text-indigo-300 text-sm font-black">/ {quizData.length}</span>
               </div>
            </div>

            {/* List Area (Expanded) */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2">
               <div className="flex items-center justify-between px-2">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">単語振り返りリスト</h3>
                 <span className="text-[9px] font-bold text-slate-300">Tap for details</span>
               </div>
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-y-auto custom-scrollbar divide-y divide-slate-50 flex-1">
                 {results.questions.map((q, idx) => {
                   const isCorrect = results.userAnswers[idx] === q.correctIndex;
                   return (
                     <div 
                       key={idx} 
                       onClick={() => onViewWord(q.word, results)}
                       className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group"
                     >
                       <div className="flex items-center gap-4 flex-1">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${isCorrect ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                           {isCorrect ? '✓' : '×'}
                         </div>
                         <div className="min-w-0">
                           <p className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition truncate">{q.word.term}</p>
                           <p className="text-[9px] text-slate-400 font-bold truncate">{q.word.meaning}</p>
                         </div>
                       </div>
                       <div className="text-right flex-shrink-0 ml-4">
                         {!isCorrect && (
                           <p className="text-[9px] font-black text-rose-400 leading-tight">Miss: {q.options[results.userAnswers[idx]]}</p>
                         )}
                         <p className="text-[9px] font-black text-emerald-500 leading-tight">Correct: {q.word.meaning}</p>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>

            {/* Bottom Button Area */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button 
                onClick={() => onComplete(results)} 
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-base shadow-lg hover:bg-black transition-all bounce-on-click"
              >
                ダッシュボードに戻る
              </button>
              <p className="text-[8px] font-black text-center text-slate-300 uppercase tracking-[0.4em]">Review Mode Active</p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const currentQ = quizData[currentIndex];
  const progress = ((currentIndex + 1) / quizData.length) * 100;

  return (
    <div className="h-full bg-slate-50 flex flex-col p-4 md:p-8 overflow-hidden">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="space-y-4 flex-shrink-0">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <button onClick={onCancel} className="hover:text-rose-500 transition">Quit Quiz</button>
            <span>Question {currentIndex + 1} / {quizData.length}</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 md:space-y-12 overflow-y-auto py-6">
          <div className="space-y-4 flex-shrink-0">
            <span className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">Analyze Term</span>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">
              {currentQ.word.term}
            </h2>
            <div className="h-1 w-12 bg-indigo-100 rounded-full mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-3 w-full flex-shrink-0">
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
                  className={`w-full py-4 md:py-5 px-6 rounded-2xl text-base md:text-lg font-black transition-all duration-200 bounce-on-click ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-16 flex items-center justify-center flex-shrink-0">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em]">EikenMaster AI Core Study</p>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
