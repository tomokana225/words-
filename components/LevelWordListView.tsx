
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
  const masteredCount = words.filter(w => w.isMastered).length;
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
    <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 bounce-on-click hover:bg-slate-50 transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-600"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div className={`px-6 py-2 bg-gradient-to-r ${getLevelColorClass()} rounded-full text-white font-black text-sm shadow-xl tracking-widest uppercase`}>
            {level === 'REVIEW' ? 'Review Mode' : level === 'ALL' ? 'All Words' : `Eiken ${level}`}
          </div>
          <div className="w-12"></div>
        </div>

        <div className={`p-8 md:p-12 rounded-[3.5rem] bg-gradient-to-br ${getLevelColorClass()} text-white shadow-2xl relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-125 transition duration-1000"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
                {level === 'REVIEW' ? '復習が必要な単語' : level === 'ALL' ? 'すべての単語' : `英検 ${level}`}
              </h2>
              <p className="text-white/80 font-bold text-lg">収録数: {words.length} 単語</p>
            </div>
            <div className="flex flex-col items-center bg-black/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 min-w-[180px]">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Achievement</span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black">{progress}</span>
                <span className="text-xl font-black opacity-40">%</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center px-4">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">単語一覧</h3>
          <button 
            onClick={onStartQuiz}
            disabled={words.length === 0}
            className={`px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl hover:bg-black transition flex items-center gap-3 bounce-on-click ${words.length === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            クイズを開始する
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {words.map((word) => (
            <div 
              key={word.id} 
              onClick={() => onViewWord(word)}
              className="group p-6 bg-white border border-slate-50 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer flex justify-between items-center"
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-500 ${
                  word.isMastered 
                    ? 'bg-emerald-100 text-emerald-500' 
                    : (word.nextReviewDate && word.nextReviewDate <= now)
                    ? 'bg-rose-100 text-rose-500 animate-pulse'
                    : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                }`}>
                  {word.isMastered ? '✓' : (word.nextReviewDate && word.nextReviewDate <= now) ? '⏰' : '•'}
                </div>
                <div>
                  <p className="font-black text-slate-700 text-xl leading-tight group-hover:text-indigo-600 transition">{word.term}</p>
                  <p className="text-sm text-slate-400 font-bold mt-1.5">{word.meaning}</p>
                </div>
              </div>
              <div className="text-slate-200 group-hover:text-indigo-400 transition transform group-hover:translate-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>
          ))}

          {words.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
              <span className="text-6xl block">🌵</span>
              <p className="text-slate-400 font-black text-xl">学習する単語がありません</p>
              <p className="text-slate-300 font-bold">右上の「単語追加」から新しい単語を登録しましょう</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LevelWordListView;
