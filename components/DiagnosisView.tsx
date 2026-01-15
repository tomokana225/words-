
import React, { useState } from 'react';
import { EikenLevel, Word } from '../types';

interface DiagnosisViewProps {
  words: Word[];
  onCancel: () => void;
}

const DiagnosisView: React.FC<DiagnosisViewProps> = ({ words, onCancel }) => {
  const [step, setStep] = useState<'level' | 'quiz' | 'result'>('level');
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const startDiagnosis = (level: EikenLevel) => {
    setLoading(true);
    setSelectedLevel(level);

    // API節約のため、ローカルの全単語リストから出題
    const levelWords = words.filter(w => w.level === level);
    
    if (levelWords.length < 4) {
      alert(`英検 ${level} の単語データが不足しています。`);
      setLoading(false);
      return;
    }

    // ランダムに10問選出
    const selected = [...levelWords].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    const quiz = selected.map(word => {
      const others = levelWords.filter(w => w.id !== word.id);
      const distractors = [...others].sort(() => 0.5 - Math.random()).slice(0, 3).map(w => w.meaning);
      const options = [word.meaning, ...distractors].sort(() => 0.5 - Math.random());
      
      return {
        term: word.term,
        meaning: word.meaning,
        options,
        correctIndex: options.indexOf(word.meaning)
      };
    });

    setQuestions(quiz);
    setLoading(false);
    setStep('quiz');
    setCurrentIdx(0);
    setScore(0);
  };

  const handleAnswer = (idx: number) => {
    if (idx === questions[currentIdx].correctIndex) {
      setScore(s => s + 1);
    }
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
    } else {
      setStep('result');
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 bg-slate-50 animate-view overflow-hidden">
      <div className="w-full max-w-2xl mx-auto flex-1 flex flex-col min-h-0">
        
        {step === 'level' && (
          <div className="space-y-8 flex-1 flex flex-col min-h-0">
            <header className="flex items-center gap-4 text-left px-2 flex-shrink-0">
              <button onClick={onCancel} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">単語力AI診断</h2>
                <p className="text-xs font-medium text-slate-500">あなたの実力を測定し、最適なレベルを判定します。</p>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
                {Object.values(EikenLevel).map(level => (
                  <button
                    key={level}
                    onClick={() => startDiagnosis(level)}
                    disabled={loading}
                    className="p-5 bg-white border border-slate-200 rounded-2xl flex flex-col items-center gap-1 group hover:border-indigo-500 hover:bg-indigo-50 transition-all bounce-on-click"
                  >
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">判定対象</span>
                    <span className="text-lg font-bold text-slate-800">英検 {level}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'quiz' && questions.length > 0 && (
          <div className="space-y-6 flex-1 flex flex-col min-h-0">
            <div className="flex justify-between items-center px-4 flex-shrink-0">
               <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">英検 {selectedLevel} 判定中</span>
               <span className="text-slate-400 text-xs font-bold">{currentIdx + 1} / {questions.length}</span>
            </div>
            
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8 flex-shrink-0">
              <div className="space-y-2 text-center">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">Q. この単語の意味は？</span>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{questions[currentIdx].term}</h2>
              </div>
              <div className="grid gap-3">
                {questions[currentIdx].options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="w-full p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-500 rounded-xl font-bold text-base transition-all bounce-on-click"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 'result' && (
          <div className="flex-1 flex flex-col items-center justify-between text-center overflow-hidden">
            <div className="flex-shrink-0 mt-4">
              <div className="relative inline-block">
                 <div className="p-10 gradient-primary rounded-full w-40 h-40 flex items-center justify-center mx-auto text-white shadow-xl ring-[10px] ring-indigo-50">
                   <div className="text-center">
                     <span className="block text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">正解率</span>
                     <span className="text-4xl font-bold">{Math.round((score / questions.length) * 100)}%</span>
                   </div>
                 </div>
                 <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-xl shadow-lg border border-slate-100 whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-800">ランク: {score === questions.length ? '完璧！' : score >= 7 ? '合格圏内' : '修行が必要'}</span>
                 </div>
              </div>
              <div className="mt-10 space-y-2">
                <h2 className="text-xl font-bold text-slate-800">英検 {selectedLevel} 診断結果</h2>
                <p className="text-slate-500 font-medium text-xs max-w-xs mx-auto">
                  {score === questions.length ? 'この級の単語力は完璧です。さらに上の級を目指しましょう！' : '基礎を固めることで、合格に大きく近づきます。毎日コツコツ学習しましょう。'}
                </p>
              </div>
            </div>
            
            <div className="w-full flex flex-col gap-3 px-4 flex-shrink-0 mt-8 mb-4">
               <button 
                 onClick={onCancel}
                 className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition bounce-on-click"
               >
                 完了してダッシュボードへ
               </button>
               <button onClick={() => setStep('level')} className="text-slate-400 font-bold text-[10px] hover:text-indigo-600 transition tracking-widest uppercase">もう一度診断する</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-[100]">
            <div className="text-center flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-slate-800 text-sm tracking-tight">AIが問題を生成しています...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiagnosisView;
