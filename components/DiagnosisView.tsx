
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
    <div className="max-w-2xl mx-auto py-6 text-center animate-view">
      {step === 'level' && (
        <div className="space-y-8">
          <header className="flex items-center gap-4 text-left px-2">
            <button onClick={onCancel} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">単語力AI診断</h2>
              <p className="text-xs font-medium text-slate-500">あなたの現在の実力を測定し、最適なレベルを判定します。</p>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
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
      )}

      {step === 'quiz' && questions.length > 0 && (
        <div className="space-y-10">
          <div className="flex justify-between items-center px-4">
             <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">英検 {selectedLevel} 判定中</span>
             <span className="text-slate-400 text-xs font-bold">{currentIdx + 1} / {questions.length}</span>
          </div>
          
          <div className="bg-white p-10 md:p-16 rounded-3xl border border-slate-200 shadow-sm space-y-12">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-[0.2em]">Q. この単語の意味は？</span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">{questions[currentIdx].term}</h2>
            </div>
            <div className="grid gap-3">
              {questions[currentIdx].options.map((opt: string, i: number) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  className="w-full p-5 bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-500 rounded-xl font-bold text-lg transition-all bounce-on-click"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-10">
          <div className="relative inline-block mt-8">
             <div className="p-12 gradient-primary rounded-full w-48 h-48 flex items-center justify-center mx-auto text-white shadow-xl ring-[12px] ring-indigo-50">
               <div className="text-center">
                 <span className="block text-[10px] font-bold opacity-70 uppercase tracking-widest mb-1">正解率</span>
                 <span className="text-5xl font-bold">{Math.round((score / questions.length) * 100)}%</span>
               </div>
             </div>
             <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white px-6 py-2 rounded-xl shadow-lg border border-slate-100 whitespace-nowrap">
                <span className="text-sm font-bold text-slate-800">推定ランク: {score === questions.length ? '完璧です！' : score >= 7 ? '合格圏内' : '学習が必要です'}</span>
             </div>
          </div>

          <div className="space-y-4 pt-8">
            <h2 className="text-2xl font-bold text-slate-800">判定結果</h2>
            <p className="text-slate-500 font-medium text-sm max-w-xs mx-auto">
              英検 {selectedLevel} レベルの単語力は {score === questions.length ? '完璧です。さらに上の級を目指しましょう！' : '基礎を固めることで、合格に大きく近づきます。毎日コツコツ学習しましょう。'}
            </p>
          </div>
          
          <div className="flex flex-col gap-3 px-4">
             <button 
               onClick={onCancel}
               className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-base shadow-lg hover:bg-black transition bounce-on-click"
             >
               ダッシュボードへ戻る
             </button>
             <button onClick={() => setStep('level')} className="text-slate-400 font-bold text-xs hover:text-indigo-600 transition">もう一度診断する</button>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-[100]">
          <div className="text-center flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-800 text-lg tracking-tight">AIが問題を生成しています...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosisView;
