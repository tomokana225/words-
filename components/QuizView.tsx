
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Word, QuizResult, QuizQuestion, QuizType } from '../types';

interface QuizViewProps {
  words: Word[];
  config: { type: QuizType | 'random', count: number, soundEnabled: boolean };
  initialResult: QuizResult | null; // 状態復元用
  onComplete: (result: QuizResult) => void;
  onViewWord: (word: Word, result: QuizResult) => void;
  onCancel: () => void;
}

// AudioContextを遅延初期化するためのシングルトン
let sharedAudioCtx: AudioContext | null = null;

const getAudioCtx = () => {
  if (!sharedAudioCtx) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
      }
    } catch (e) {
      console.error("Failed to initialize AudioContext:", e);
    }
  }
  return sharedAudioCtx;
};

const playSFX = async (type: 'correct' | 'wrong') => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  // 常にレジュームを試みる
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  } catch (e) {
    console.warn("Could not resume AudioContext:", e);
    return;
  }
  
  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  if (type === 'correct') {
    // 「ピンポン」
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.connect(gain);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    playTone(659.25, now, 0.15); // E5
    playTone(880.00, now + 0.1, 0.25); // A5
  } else {
    // 「ブー」
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(140, now);
    osc2.frequency.setValueAtTime(144, now);
    
    osc1.connect(gain);
    osc2.connect(gain);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
    gain.gain.linearRampToValueAtTime(0, now + 0.4);
    
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }
};

const QuizView: React.FC<QuizViewProps> = ({ words, config, initialResult, onComplete, onViewWord, onCancel }) => {
  const [currentIndex, setCurrentIndex] = useState(initialResult ? config.count - 1 : 0);
  const [userAnswers, setUserAnswers] = useState<number[]>(initialResult ? initialResult.userAnswers : []);
  const [isFinished, setIsFinished] = useState(!!initialResult);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled);

  // クイズデータの生成または復元
  const quizData = useMemo(() => {
    if (initialResult) return initialResult.questions;
    if (!words || words.length === 0) return [];
    
    const pool = [...words].sort(() => 0.5 - Math.random()).slice(0, config.count);
    
    return pool.map(word => {
      let type: QuizType = 'wordToMeaning';
      if (config.type !== 'random') {
        type = config.type;
        if (type === 'sentenceFillIn' && (!word.exampleSentence || word.exampleSentence.length < 5)) {
          type = 'wordToMeaning';
        }
      } else {
        const quizTypes: QuizType[] = ['wordToMeaning', 'meaningToWord'];
        if (word.exampleSentence && word.exampleSentence.length > 5) {
          quizTypes.push('sentenceFillIn');
        }
        type = quizTypes[Math.floor(Math.random() * quizTypes.length)];
      }

      let questionText = '';
      let options: string[] = [];
      let correctValue = '';

      if (type === 'wordToMeaning') {
        questionText = word.term;
        correctValue = word.meaning;
        const distractors = words.filter(w => w.id !== word.id).map(w => w.meaning).sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [correctValue, ...distractors].sort(() => 0.5 - Math.random());
      } else if (type === 'meaningToWord') {
        questionText = word.meaning;
        correctValue = word.term;
        const distractors = words.filter(w => w.id !== word.id).map(w => w.term).sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [correctValue, ...distractors].sort(() => 0.5 - Math.random());
      } else if (type === 'sentenceFillIn') {
        const regex = new RegExp(word.term, 'gi');
        questionText = word.exampleSentence?.replace(regex, '_____') || word.term;
        correctValue = word.term;
        const distractors = words.filter(w => w.id !== word.id).map(w => w.term).sort(() => 0.5 - Math.random()).slice(0, 3);
        options = [correctValue, ...distractors].sort(() => 0.5 - Math.random());
      }
      return { word, type, questionText, options, correctIndex: options.indexOf(correctValue) } as QuizQuestion;
    });
  }, [words, config, initialResult]);

  const handleAnswer = (index: number) => {
    if (selectedIdx !== null || quizData.length === 0) return;
    
    setSelectedIdx(index);
    const isCorrect = index === quizData[currentIndex].correctIndex;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    
    if (soundEnabled) playSFX(isCorrect ? 'correct' : 'wrong');

    setTimeout(() => {
      const nextAnswers = [...userAnswers, index];
      setUserAnswers(nextAnswers);
      setSelectedIdx(null);
      setFeedback(null);
      if (currentIndex < quizData.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true);
      }
    }, 350);
  };

  const results = useMemo(() => {
    if (initialResult) return initialResult;
    if (!isFinished) return null;
    return {
      questions: quizData,
      userAnswers,
      score: userAnswers.reduce((acc, ans, idx) => ans === quizData[idx].correctIndex ? acc + 1 : acc, 0),
      timestamp: Date.now()
    } as QuizResult;
  }, [isFinished, quizData, userAnswers, initialResult]);

  // マウント時にAudioContextの再開を試みる
  useEffect(() => {
    const resume = () => {
      const ctx = getAudioCtx();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    };
    window.addEventListener('click', resume, { once: true });
    window.addEventListener('touchstart', resume, { once: true });
    return () => {
      window.removeEventListener('click', resume);
      window.removeEventListener('touchstart', resume);
    };
  }, []);

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
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Progress Saved</p>
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
                           <p className="text-[9px] font-bold text-slate-300 uppercase">{q.word.meaning}</p>
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
            <button onClick={() => onComplete(results)} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all bounce-on-click">学習を完了してホームへ</button>
          </div>
        </div>
      );
    }
    return <div className="p-10 text-center font-bold text-slate-400">対象の単語がありません</div>;
  }

  const currentQ = quizData[currentIndex];

  return (
    <div className="h-full bg-slate-50 flex flex-col p-4 md:p-8 overflow-hidden animate-view relative">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="space-y-4 flex-shrink-0">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={onCancel} className="hover:text-rose-500 transition px-2 py-1 font-black">中止する</button>
            <div className="flex gap-1 flex-1 px-4 md:px-8">
              {quizData.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < currentIndex ? 'bg-indigo-300' : i === currentIndex ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)] scale-y-125' : 'bg-slate-200'}`}></div>
              ))}
            </div>
            <button 
              onClick={() => {
                const ctx = getAudioCtx();
                if (ctx && ctx.state === 'suspended') ctx.resume();
                setSoundEnabled(!soundEnabled);
              }}
              className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-indigo-600' : 'text-slate-300'}`}
              title="サウンド切替"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                {soundEnabled ? (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  </>
                ) : (
                  <>
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <line x1="23" y1="9" x2="17" y2="15"></line>
                    <line x1="17" y1="9" x2="23" y2="15"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8 md:space-y-12 overflow-y-auto py-10">
          <div className="space-y-4 flex-shrink-0 px-4 w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100">
                {currentQ.type === 'sentenceFillIn' ? 'Sentence Fill-in' : currentQ.type === 'meaningToWord' ? 'Meaning to Word' : 'Word to Meaning'}
              </span>
            </div>
            <h2 className={`font-black text-slate-900 tracking-tighter leading-tight mx-auto max-w-lg ${currentQ.type === 'sentenceFillIn' ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-5xl md:text-7xl'}`}>
              {currentQ.questionText}
            </h2>
            {currentQ.type === 'sentenceFillIn' && (
              <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-50/50 mt-4 max-w-md mx-auto">
                <p className="text-xs font-bold text-slate-500 italic">"{currentQ.word.exampleSentenceJapanese}"</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-3 w-full flex-shrink-0 max-w-md mx-auto px-4">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrectIdx = idx === currentQ.correctIndex;
              
              let btnClass = "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50 shadow-sm";
              if (selectedIdx !== null) {
                if (isSelected) {
                  btnClass = feedback === 'correct' 
                    ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-200 scale-[1.02]" 
                    : "bg-rose-500 border-rose-500 text-white shadow-rose-200 scale-[0.98]";
                } else if (isCorrectIdx) {
                  btnClass = "bg-emerald-50 border-emerald-200 text-emerald-700";
                } else {
                  btnClass = "bg-white border-slate-100 text-slate-300 opacity-50";
                }
              }

              return (
                <button 
                  key={`${currentIndex}-${idx}`} 
                  onClick={() => handleAnswer(idx)} 
                  disabled={selectedIdx !== null}
                  className={`w-full py-4 px-6 rounded-[1.5rem] text-base font-black transition-all duration-200 bounce-on-click flex items-center justify-between ${btnClass} will-change-transform`}
                >
                  <span className="flex-1 text-center">{option}</span>
                  <div className="w-6 flex items-center justify-center">
                    {selectedIdx !== null && isSelected && (
                      <span className="animate-in zoom-in">
                        {feedback === 'correct' ? '✓' : '×'}
                      </span>
                    )}
                    {selectedIdx !== null && isCorrectIdx && !isSelected && (
                      <span className="text-emerald-500 text-sm">✓</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-10 flex items-center justify-center flex-shrink-0">
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em] animate-pulse">Efficiency Learning AI Active</p>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
