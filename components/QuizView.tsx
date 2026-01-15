
import React, { useState, useMemo } from 'react';
import { Word, QuizResult, QuizQuestion, QuizType } from '../types';

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
    
    // 最大10問を抽出
    const pool = [...words].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    return pool.map(word => {
      // ランダムにクイズタイプを決定
      const types: QuizType[] = ['wordToMeaning', 'meaningToWord'];
      if (word.exampleSentence) types.push('sentenceFillIn');
      const type = types[Math.floor(Math.random() * types.length)];

      let questionText = '';
      let options: string[] = [];
      let correctValue = '';

      if (type === 'wordToMeaning') {
        questionText = word.term;
        correctValue = word.meaning;
        const distractors = words
          .filter(w => w.id !== word.id)
          .map(w => w.meaning)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        options = [correctValue, ...distractors].sort(() => 0.5 - Math.random());
      } else if (type === 'meaningToWord') {
        questionText = word.meaning;
        correctValue = word.term;
        const distractors = words
          .filter(w => w.id !== word.id)
          .map(w => w.term)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        options = [correctValue, ...distractors].sort(() => 0.5 - Math.random());
      } else if (type === 'sentenceFillIn') {
        // 例文中の単語を伏せ字にする
        const regex = new RegExp(word.term, 'gi');
        questionText = word.exampleSentence?.replace(regex, '_____') || word.term;
        correctValue = word.term;
        const distractors = words
          .filter(w => w.id !== word.id)
          .map(w => w.term)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        options = [correctValue, ...distractors].sort(() => 0.5 - Math.random());
      }

      const correctIndex = options.indexOf(correctValue);
      return { word, type, questionText, options, correctIndex } as QuizQuestion;
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
    }, 550);
  };

  const results = useMemo(() => {
    if (!isFinished) return null;
    return {
      questions: quizData,
      userAnswers,
      score: userAnswers.reduce((acc, ans, idx) => ans === quizData[idx].correctIndex ? acc + 1 : acc, 0),
      timestamp: Date.now()
    } as QuizResult;
  }, [isFinished, quizData, userAnswers]);

  if (quizData.length === 0 || (isFinished && results)) {
    if (isFinished && results) {
      return (
        <div className="h-full bg-slate-50 flex flex-col p-4 md:p-6 animate-view overflow-hidden">
          <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col min-h-0 gap-4">
            <div className="bg-white rounded-[2rem] p-6 flex items-center justify-between shadow-sm border border-slate-100 flex-shrink-0">
               <div className="flex items-center gap-4">
                 <div className="text-4xl">🏅</div>
                 <div className="text-left">
                   <h2 className="text-xl font-black tracking-tight text-slate-900">学習スコア</h2>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Mastery Progress Saved</p>
                 </div>
               </div>
               <div className="flex items-center gap-1 bg-indigo-50 px-5 py-2 rounded-2xl border border-indigo-100">
                 <p className="text-indigo-600 text-3xl font-black">{results.score}</p>
                 <span className="text-indigo-300 text-sm font-black">/ {quizData.length}</span>
               </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-2">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">振り返り</h3>
               <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-y-auto custom-scrollbar divide-y divide-slate-50 flex-1">
                 {results.questions.map((q, idx) => {
                   const isCorrect = results.userAnswers[idx] === q.correctIndex;
                   return (
                     <div key={idx} onClick={() => onViewWord(q.word, results)} className="p-5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group">
                       <div className="flex items-center gap-4 flex-1">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${isCorrect ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                           {isCorrect ? '✓' : '×'}
                         </div>
                         <div className="min-w-0">
                           <p className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition">{q.word.term}</p>
                           <div className="flex items-center gap-2">
                             <span className="text-[9px] font-bold text-slate-300 uppercase">{q.type}</span>
                             <div className="flex gap-0.5">
                               {[1,2,3,4].map(s => (
                                 <div key={s} className={`w-1 h-1 rounded-full ${s <= (q.word.masteryCount || 0) ? 'bg-indigo-400' : 'bg-slate-100'}`}></div>
                               ))}
                             </div>
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <p className={`text-[10px] font-black ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {isCorrect ? 'Perfect' : 'Review'}
                         </p>
                       </div>
                     </div>
                   );
                 })}
               </div>
            </div>

            <button onClick={() => onComplete(results)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-black transition-all bounce-on-click">ダッシュボードに戻る</button>
          </div>
        </div>
      );
    }
    return <div className="p-10 text-center font-bold text-slate-400">対象の単語がありません</div>;
  }

  const currentQ = quizData[currentIndex];
  const progress = ((currentIndex + 1) / quizData.length) * 100;

  return (
    <div className="h-full bg-slate-50 flex flex-col p-4 md:p-8 overflow-hidden">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="space-y-4 flex-shrink-0">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={onCancel} className="hover:text-rose-500 transition">Quit</button>
            <div className="flex gap-1">
              {quizData.map((_, i) => (
                <div key={i} className={`h-1 w-4 rounded-full ${i < currentIndex ? 'bg-indigo-300' : i === currentIndex ? 'bg-indigo-600 animate-pulse' : 'bg-slate-200'}`}></div>
              ))}
            </div>
            <span>{currentIndex + 1} / {quizData.length}</span>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 md:space-y-12 overflow-y-auto py-10">
          <div className="space-y-4 flex-shrink-0 px-4">
            <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100 mb-2">
              {currentQ.type === 'sentenceFillIn' ? 'Sentence Fill-in' : currentQ.type === 'meaningToWord' ? 'Meaning to Word' : 'Word to Meaning'}
            </span>
            <h2 className={`font-black text-slate-900 tracking-tighter leading-tight ${currentQ.type === 'sentenceFillIn' ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-5xl md:text-7xl'}`}>
              {currentQ.questionText}
            </h2>
            {currentQ.type === 'sentenceFillIn' && (
              <p className="text-xs font-bold text-slate-400 mt-4">{currentQ.word.exampleSentenceJapanese}</p>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-3 w-full flex-shrink-0 max-w-md mx-auto">
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
                  className={`w-full py-4 px-6 rounded-[1.5rem] text-base font-black transition-all duration-200 bounce-on-click ${btnClass}`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-10 flex items-center justify-center flex-shrink-0">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">Multi-Modality Training</p>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
