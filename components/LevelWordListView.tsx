
import React from 'react';
import { Word, EikenLevel } from '../types';

interface LevelWordListViewProps {
  level: EikenLevel | 'ALL' | 'REVIEW';
  words: Word[];
  onStartQuiz: () => void;
  onBack: () => void;
  onViewWord: (word: Word) => void;
}

const LevelWordListView: React.FC<LevelWordListViewProps> = ({ level, words, onStartQuiz, onBack, onViewWord }) => {
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

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden animate-view relative">
      {/* Scrollable Header + List Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
        <header className="p-4 md:p-8 space-y-8">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 bounce-on-click hover:bg-slate-50 transition">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-600"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div className={`px-5 py-1.5 bg-gradient-to-r ${getLevelColorClass()} rounded-full text-white font-black text-[10px] shadow-lg tracking-widest uppercase`}>
              {level === 'REVIEW' ? 'Review Mode' : level === 'ALL' ? 'All Words' : `Eiken ${level}`}
            </div>
            <div className="w-10"></div>
          </div>

          <div className={`p-8 rounded-[2.5rem] bg-gradient-to-br ${getLevelColorClass()} text-white shadow-xl relative overflow-hidden`}>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-4xl font-black tracking-tighter">
                  {level === 'REVIEW' ? '復習単語' : level === 'ALL' ? '全単語' : `英検 ${level}`}
                </h2>
                <p className="text-white/80 font-bold text-sm">収録: {words.length} words</p>
              </div>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-md p-4 px-6 rounded-2xl border border-white/20">
                <span className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Mastery</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{progress}</span>
                  <span className="text-xs font-black opacity-40">%</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 md:px-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">単語リスト</h3>
            <span className="text-[10px] font-bold text-slate-300">{words.length} items total</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {words.map((word) => (
              <div 
                key={word.id} 
                onClick={() => onViewWord(word)}
                className="group p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 ${
                    (word.masteryCount || 0) >= 4 
                      ? 'bg-emerald-50 text-emerald-500' 
                      : (word.nextReviewDate && word.nextReviewDate <= now)
                      ? 'bg-rose-50 text-rose-500 animate-pulse'
                      : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                  }`}>
                    {(word.masteryCount || 0) >= 4 ? '✓' : (word.nextReviewDate && word.nextReviewDate <= now) ? '⏰' : '•'}
                  </div>
                  <div>
                    <p className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition">{word.term}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 truncate max-w-[150px]">{word.meaning}</p>
                  </div>
                </div>
                <div className="text-slate-200 group-hover:text-indigo-300 transition transform group-hover:translate-x-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
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

      {/* 改善: クイズ開始ボタンを画面下部に固定 */}
      <div className="absolute bottom-6 left-0 right-0 px-4 md:px-8 z-20 pointer-events-none">
        <div className="max-w-md mx-auto">
          <button 
            onClick={onStartQuiz}
            disabled={words.length === 0}
            className={`w-full pointer-events-auto py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 bounce-on-click ${words.length === 0 ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}
          >
            <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
            <span>クイズ学習を開始する</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelWordListView;
