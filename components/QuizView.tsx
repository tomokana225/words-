
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Word, QuizResult, QuizQuestion, QuizType } from '../types';

interface QuizViewProps {
  words: Word[];
  config: { type: QuizType | 'random', count: number, soundEnabled: boolean };
  initialResult: QuizResult | null;
  onComplete: (result: QuizResult) => void;
  onViewWord: (word: Word, result: QuizResult) => void;
  onCancel: () => void;
}

// シングルトンのAudioContext
let globalAudioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!globalAudioCtx) {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) globalAudioCtx = new AudioCtx();
    } catch (e) {
      console.error("AudioContext init error:", e);
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(console.error);
  }
  return globalAudioCtx;
};

const playSFX = (type: 'correct' | 'wrong') => {
  const ctx = initAudio();
  if (!ctx) return;

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);

  if (type === 'correct') {
    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      osc.connect(gain);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    playTone(659.25, now, 0.15);
    playTone(880.00, now + 0.1, 0.3);
  } else {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(140, now);
    osc2.frequency.setValueAtTime(146, now);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  }
};

const QuizView: React.FC<QuizViewProps> = ({ words, config, initialResult, onComplete, onViewWord, onCancel }) => {
  const [quizData] = useState<QuizQuestion[]>(() => {
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
        if (word.exampleSentence && word.exampleSentence.length > 5) quizTypes.push('sentenceFillIn');
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
  });

  const [currentIndex, setCurrentIndex] = useState(initialResult ? initialResult.userAnswers.length : 0);
  const [userAnswers, setUserAnswers] = useState<number[]>(initialResult ? initialResult.userAnswers : []);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(config.soundEnabled);
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (initialResult && initialResult.userAnswers.length >= quizData.length) {
      setIsFinished(true);
    }
  }, [initialResult, quizData.length]);

  const handleAnswer = (index: number) => {
    if (isTransitioning.current || selectedIdx !== null || quizData.length === 0 || isFinished) return;
    
    isTransitioning.current = true;
    initAudio();

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
        isTransitioning.current = false;
      } else {
        setIsFinished(true);
      }
    }, 400);
  };

  const results = useMemo(() => {
    if (!isFinished && !initialResult) return null;
    return {
      questions: quizData,
      userAnswers: userAnswers,
      score: userAnswers.reduce((acc, ans, idx) => {
        if (quizData[idx] && ans === quizData[idx].correctIndex) return acc + 1;
        return acc;
      }, 0),
      timestamp: Date.now()
    } as QuizResult;
  }, [isFinished, quizData, userAnswers, initialResult]);

  if (quizData.length === 0) {
    return <div className="h-full flex items-center justify-center font-bold text-slate-400">問題を作成中...</div>;
  }

  // --- 終了画面 (レイアウト調整版) ---
  if (isFinished && results) {
    return (
      <div className="h-full flex flex-col bg-slate-50 animate-view overflow-hidden">
        <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col min-h-0 p-4 md:p-6">
          
          {/* 固定ヘッダー: スコア */}
          <div className="bg-white rounded-[2rem] p-5 flex items-center justify-between shadow-sm border border-slate-100 flex-shrink-0 mb-4">
             <div className="flex items-center gap-4">
               <div className="text-3xl">🏅</div>
               <div className="text-left">
                 <h2 className="text-lg font-black tracking-tight text-slate-900">学習結果</h2>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Scientific Review</p>
               </div>
             </div>
             <div className="flex items-center gap-1 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100">
               <p className="text-indigo-600 text-2xl font-black">{results.score}</p>
               <span className="text-indigo-300 text-xs font-black">/ {quizData.length}</span>
             </div>
          </div>

          {/* 可変エリア: 振り返りリスト (ここがスクロール) */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden mb-4">
             <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Wrong Words / Review</h3>
             <div className="flex-1 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-y-auto custom-scrollbar divide-y divide-slate-50">
               {results.questions.map((q, idx) => {
                 const isCorrect = results.userAnswers[idx] === q.correctIndex;
                 return (
                   <div key={idx} onClick={() => onViewWord(q.word, results)} className="p-4 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer group">
                     <div className="flex items-center gap-4 flex-1">
                       <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${isCorrect ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                         {isCorrect ? '✓' : '×'}
                       </div>
                       <div className="min-w-0">
                         <p className="font-black text-slate-800 text-sm group-hover:text-indigo-600 transition truncate">{q.word.term}</p>
                         <p className="text-[8px] font-bold text-slate-300 uppercase truncate">{q.word.meaning}</p>
                       </div>
                     </div>
                     <div className="text-right flex-shrink-0 ml-2">
                       <p className={`text-[9px] font-black ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {isCorrect ? 'OK' : 'Review'}
                       </p>
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

          {/* 固定フッター: 完了ボタン */}
          <div className="flex-shrink-0">
            <button 
              onClick={() => onComplete(results)} 
              className="w-full py-4 bg-slate-900 text-white rounded-[1.2rem] font-black text-sm shadow-xl hover:bg-black transition-all"
            >
              学習を完了して戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  // クイズ実行中
  const currentQ = quizData[currentIndex];
  if (!currentQ) return null;

  return (
    <div className="h-full bg-slate-50 flex flex-col p-4 md:p-8 overflow-hidden animate-view relative">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between overflow-hidden">
        <div className="space-y-4 flex-shrink-0">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
            <button onClick={onCancel} className="hover:text-rose-500 transition px-2 py-1 font-black">中止</button>
            <div className="flex gap-1 flex-1 px-4 md:px-8">
              {quizData.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < currentIndex ? 'bg-indigo-300' : i === currentIndex ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)] scale-y-125' : 'bg-slate-200'}`}></div>
              ))}
            </div>
            <button 
              onClick={() => {
                initAudio();
                setSoundEnabled(!soundEnabled);
              }}
              className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-indigo-600' : 'text-slate-300'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
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

        <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6 md:space-y-10 overflow-y-auto py-6">
          <div className="space-y-3 flex-shrink-0 px-4 w-full">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="px-3 py-0.5 bg-indigo-50 text-indigo-500 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-indigo-100">
                {currentQ.type === 'sentenceFillIn' ? 'Sentence Fill-in' : currentQ.type === 'meaningToWord' ? 'Meaning to Word' : 'Word to Meaning'}
              </span>
            </div>
            <h2 className={`font-black text-slate-900 tracking-tighter leading-tight mx-auto max-w-lg ${currentQ.type === 'sentenceFillIn' ? 'text-xl md:text-2xl lg:text-3xl' : 'text-4xl md:text-6xl'}`}>
              {currentQ.questionText}
            </h2>
            {currentQ.type === 'sentenceFillIn' && currentQ.word && (
              <div className="bg-indigo-50/30 p-3 rounded-xl border border-indigo-50/50 mt-2 max-w-sm mx-auto">
                <p className="text-[10px] font-bold text-slate-500 italic">"{currentQ.word.exampleSentenceJapanese}"</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-2 w-full flex-shrink-0 max-w-sm mx-auto px-4">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedIdx === idx;
              const isCorrectIdx = idx === currentQ.correctIndex;
              
              let btnClass = "bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50 shadow-sm";
              if (selectedIdx !== null) {
                if (isSelected) {
                  btnClass = feedback === 'correct' 
                    ? "bg-emerald-500 border-emerald-500 text-white" 
                    : "bg-rose-500 border-rose-500 text-white";
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
                  disabled={selectedIdx !== null || isFinished}
                  className={`w-full py-3 px-5 rounded-[1.2rem] text-sm font-black transition-all flex items-center justify-center ${btnClass} will-change-transform`}
                >
                  <span className="truncate">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-8 flex items-center justify-center flex-shrink-0">
          <p className="text-[7px] font-black text-slate-300 uppercase tracking-[0.4em]">Efficiency Learning Active</p>
        </div>
      </div>
    </div>
  );
};

export default QuizView;
