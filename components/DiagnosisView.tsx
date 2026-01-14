
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
  const [loading, setLoading] = useState(false);

  const startDiagnosis = async (level: EikenLevel) => {
    setLoading(true);
    setSelectedLevel(level);
    const words = await getDiagnosticQuiz(level);
    setQuestions(words);
    setLoading(false);
    setStep('quiz');
  };

  return (
    <div className="max-w-xl mx-auto py-12 text-center">
      {step === 'level' && (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
          <header>
            <h1 className="text-3xl font-black mb-2">単語力診断</h1>
            <p className="text-slate-500">現在のレベルに合わせた実力テストを行います</p>
          </header>

          <div className="grid gap-3">
            {Object.values(EikenLevel).map(level => (
              <button
                key={level}
                onClick={() => startDiagnosis(level)}
                disabled={loading}
                className="p-5 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 transition flex justify-between items-center group"
              >
                <span>英検 {level} 診断</span>
                <span className="text-slate-300 group-hover:text-indigo-500 transition">開始 →</span>
              </button>
            ))}
          </div>

          <button onClick={onCancel} className="text-slate-400 font-medium">戻る</button>
        </div>
      )}

      {step === 'quiz' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">英検 {selectedLevel} レベル診断</h2>
          <div className="bg-white p-8 rounded-2xl border text-left">
            <p className="mb-4 font-medium text-slate-500">以下の単語リストの中で意味がわかるものはいくつありますか？</p>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="flex justify-between items-center p-3 border-b last:border-0">
                  <span className="font-bold text-lg">{q.term}</span>
                  <span className="text-slate-400 text-sm">わかる / わからない</span>
                </div>
              ))}
            </div>
          </div>
          <button 
            onClick={() => setStep('result')}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold"
          >
            診断を終了する
          </button>
        </div>
      )}

      {step === 'result' && (
        <div className="space-y-8 animate-in zoom-in-95 duration-300">
          <div className="p-12 bg-indigo-600 rounded-full w-48 h-48 flex items-center justify-center mx-auto text-white">
            <div className="text-center">
              <span className="block text-xs opacity-80">推定単語力</span>
              <span className="text-4xl font-black">{selectedLevel}</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold">お疲れ様でした！</h2>
          <p className="text-slate-500">診断の結果、{selectedLevel} レベルの語彙力が定着しています。さらに上のレベルを目指しましょう。</p>
          <button 
            onClick={onCancel}
            className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold"
          >
            ダッシュボードへ
          </button>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-bold text-slate-700">AIが問題を生成しています...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosisView;
