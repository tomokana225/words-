
import React, { useState } from 'react';
import { EikenLevel } from '../types';
import { getDiagnosticQuiz } from '../services/geminiService';

interface DiagnosisViewProps {
  onCancel: () => void;
}

const DiagnosisView: React.FC<DiagnosisViewProps> = ({ onCancel }) => {
  const [step, setStep] = useState<'level' | 'quiz' | 'result'>('level');
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  const startDiagnosis = async (level: EikenLevel) => {
    setLoading(true);
    setSelectedLevel(level);
    const quiz = await getDiagnosticQuiz(level);
    setQuestions(quiz);
    setLoading(false);
    setStep('quiz');
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
    <div className="max-w-2xl mx-auto py-12 text-center">
      {step === 'level' && (
        <div className="space-y-10 animate-in zoom-in-95 duration-300">
          <header className="space-y-4">
            <h1 className="text-4xl font-black tracking-tighter text-slate-800">単語力AI診断</h1>
            <p className="text-slate-500 font-bold">英検レベルを選択して、あなたの現在の実力をAIが測定します</p>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.values(EikenLevel).map(level => (
              <button
                key={level}
                onClick={() => startDiagnosis(level)}
                disabled={loading}
                className="p-6 bg-white border-2 border-slate-100 rounded-3xl font-black text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 hover:scale-[1.02] transition-all flex flex-col items-center gap-2 group relative overflow-hidden"
              >
                <span className="text-xs text-indigo-400 uppercase tracking-widest">Target Grade</span>
                <span className="text-2xl font-black">英検 {level}</span>
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </button>
            ))}
          </div>

          <button onClick={onCancel} className="text-slate-400 font-black uppercase tracking-widest text-sm hover:text-rose-500 transition">キャンセル</button>
        </div>
      )}

      {step === 'quiz' && questions.length > 0 && (
        <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-500">
          <div className="flex justify-between items-center px-4">
             <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{selectedLevel} 診断中</span>
             <span className="text-slate-300 font-black">{currentIdx + 1} / {questions.length}</span>
          </div>
          
          <div className="bg-white p-10 md:p-16 rounded-[3rem] border-2 border-slate-50 shadow-2xl space-y-12">
            <h2 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter leading-tight">{questions[currentIdx].term}</h2>
            <div className="grid gap-4">
              {questions[currentIdx].options.map((opt: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full p-6 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-2xl font-black text-xl transition-all bounce-on-click border border-slate-100"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-10 animate-in zoom-in-95 duration-500">
          <div className="relative inline-block">
             <div className="p-16 gradient-primary rounded-full w-64 h-64 flex items-center justify-center mx-auto text-white shadow-2xl ring-[20px] ring-indigo-50">
               <div className="text-center">
                 <span className="block text-xs font-black opacity-70 uppercase tracking-widest mb-1">Score</span>
                 <span className="text-7xl font-black">{Math.round((score / questions.length) * 100)}%</span>
               </div>
             </div>
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-8 py-3 rounded-2xl shadow-xl border border-slate-100 whitespace-nowrap">
                <span className="font-black text-slate-800">推定ランク: {score === questions.length ? '完璧！' : score >= 3 ? '合格圏内' : '修行が必要'}</span>
             </div>
          </div>

          <div className="space-y-4 pt-8">
            <h2 className="text-3xl font-black text-slate-800">診断が完了しました！</h2>
            <p className="text-slate-500 font-bold max-w-md mx-auto">
              英検 {selectedLevel} レベルの単語力は {score === questions.length ? '申し分ありません！さらに上の級に挑戦しましょう。' : '基礎固めが必要です。アプリで毎日学習を続けましょう。'}
            </p>
          </div>
          
          <div className="flex flex-col gap-3">
             <button 
               onClick={onCancel}
               className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-black transition bounce-on-click"
             >
               ダッシュボードへ戻る
             </button>
             <button onClick={() => setStep('level')} className="text-slate-400 font-bold hover:text-indigo-600 transition">もう一度診断する</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-[100]">
          <div className="text-center flex flex-col items-center gap-6">
            <div className="w-20 h-20 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-2xl"></div>
            <p className="font-black text-slate-800 text-2xl tracking-tight">AIが最適な診断問題を<br/>生成しています...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosisView;
