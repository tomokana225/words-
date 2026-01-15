
import React, { useState } from 'react';
import { Word, EikenLevel, QuizType } from '../types';

interface LevelWordListViewProps {
  level: EikenLevel | 'ALL' | 'REVIEW';
  words: Word[];
  onStartQuiz: (config: { type: QuizType | 'random', count: number, soundEnabled: boolean }) => void;
  onBack: () => void;
  onViewWord: (word: Word) => void;
}

const LevelWordListView: React.FC<LevelWordListViewProps> = ({ level, words, onStartQuiz, onBack, onViewWord }) => {
  const [showConfig, setShowConfig] = useState(false);
  const [selectedType, setSelectedType] = useState<QuizType | 'random'>('random');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const masteredCount = words.filter(w => (w.masteryCount || 0) >= 4).length;
  const progress = words.length > 0 ? Math.round((masteredCount / words.length) * 100) : 0;
  const now = Date.now();

  const getLevelColorClass = () => {
    switch (level) {
      case EikenLevel.GRADE_3: return 'from-emerald-400 to-emerald-600 shadow-emerald-200';
      case EikenLevel.GRADE_PRE_2: return 'from-sky-400 to-sky-600 shadow-sky-200';
      case EikenLevel.GRADE_2: return 'from-indigo-400 to-indigo-600 shadow-indigo-200';
      case EikenLevel.GRADE_PRE_1: return 'from-amber-400 to-amber-600 shadow-amber-200';
      case EikenLevel.GRADE_1: return 'from-rose-400 to-rose-600 shadow-rose-200';
      case 'REVIEW': return 'from-rose-500 to-orange-600 shadow-rose-200';
      default: return 'from-slate-600 to-slate-800 shadow-slate-200';
    }
  };

  const handleStart = () => {
    onStartQuiz({ type: selectedType, count: questionCount, soundEnabled });
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden animate-view relative">
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        <header className="p-4 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 bounce-on-click hover:bg-slate-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-600"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div className={`px-5 py-1.5 bg-gradient-to-r ${getLevelColorClass()} rounded-full text-white font-black text-[10px] shadow-lg tracking-widest uppercase`}>
              {level === 'REVIEW' ? 'Review Mode' : level === 'ALL' ? 'All Words' : `Eiken ${level}`}
            </div>
            <div className="w-10"></div>
          </div>

          <div className={`p-6 md:p-8 rounded-[2rem] bg-gradient-to-br ${getLevelColorClass()} text-white shadow-xl relative overflow-hidden`}>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-3xl md:text-4xl font-black tracking-tighter">
                  {level === 'REVIEW' ? '復習単語' : level === 'ALL' ? '全単語' : `英検 ${level}`}
                </h2>
                <p className="text-white/80 font-bold text-xs">収録: {words.length} words</p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 px-5 rounded-2xl border border-white/20">
                <div className="text-center">
                   <span className="text-[8px] font-black uppercase tracking-widest block opacity-60">Mastery</span>
                   <span className="text-2xl font-black">{progress}<span className="text-[10px] ml-0.5 opacity-40">%</span></span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
            {!showConfig ? (
              <button 
                onClick={() => setShowConfig(true)}
                disabled={words.length === 0}
                className={`w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 bounce-on-click ${words.length === 0 ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
              >
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <span>クイズ学習を開始する</span>
              </button>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">クイズ設定</h3>
                  <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-rose-500 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">出題形式</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'random', label: 'ランダム', icon: '⚡️' },
                      { id: 'wordToMeaning', label: '英→日', icon: '🇯🇵' },
                      { id: 'meaningToWord', label: '日→英', icon: '🇺🇸' },
                      { id: 'sentenceFillIn', label: '例文穴埋め', icon: '📝' },
                    ].map(type => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id as any)}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-bold text-sm ${selectedType === type.id ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                        <span className="text-base">{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">問題数</p>
                    <div className="flex gap-2">
                      {[5, 10, 20].map(count => (
                        <button
                          key={count}
                          disabled={words.length < count && count !== 5}
                          onClick={() => setQuestionCount(count)}
                          className={`flex-1 py-3 rounded-xl border-2 transition-all font-black text-sm ${questionCount === count ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200 disabled:opacity-30'}`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">効果音</p>
                    <button 
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`w-full py-3 rounded-xl border-2 transition-all font-black text-sm flex items-center justify-center gap-2 ${soundEnabled ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-50' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                    >
                      <span className="text-base">{soundEnabled ? '🔊' : '🔇'}</span>
                      {soundEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={handleStart}
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 bounce-on-click"
                >
                  学習スタート
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="px-4 md:px-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">単語リスト</h3>
            <span className="text-[10px] font-bold text-slate-300">{words.length} words</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {words.map((word) => (
              <div 
                key={word.id} 
                onClick={() => onViewWord(word)}
                className="group p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-300 ${
                    (word.masteryCount || 0) >= 4 
                      ? 'bg-emerald-50 text-emerald-500' 
                      : (word.nextReviewDate && word.nextReviewDate <= now)
                      ? 'bg-rose-50 text-rose-500 animate-pulse'
                      : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                  }`}>
                    {(word.masteryCount || 0) >= 4 ? '✓' : (word.nextReviewDate && word.nextReviewDate <= now) ? '⏰' : '•'}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition">{word.term}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5 truncate max-w-[150px]">{word.meaning}</p>
                  </div>
                </div>
                <div className="text-slate-200 group-hover:text-indigo-300 transition transform group-hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
              </div>
            ))}

            {words.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-30 flex flex-col items-center gap-4">
                <span className="text-5xl">🌱</span>
                <p className="font-black text-sm uppercase tracking-widest">No words found in this category</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LevelWordListView;
