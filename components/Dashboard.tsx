
import React, { useState, useMemo } from 'react';
import { Word, EikenLevel } from '../types';

interface DashboardProps {
  words: Word[];
  onSelectLevel: (level: EikenLevel | 'ALL' | 'REVIEW') => void;
  onViewWord: (word: Word) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ words, onSelectLevel, onViewWord }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'mastered' | 'weak' | 'review'>('all');

  const now = Date.now();
  const reviewCount = words.filter(w => w.nextReviewDate && w.nextReviewDate <= now && !w.isMastered).length;
  const masteredCount = words.filter(w => w.isMastered).length;
  const weakCount = words.filter(w => !w.isMastered && (w.difficultyScore || 0) > 0).length;
  
  const levels = Object.values(EikenLevel);

  const filteredWords = useMemo(() => {
    let list = words;
    if (filter === 'mastered') list = words.filter(w => w.isMastered);
    if (filter === 'weak') list = words.filter(w => !w.isMastered && (w.difficultyScore || 0) > 0);
    if (filter === 'review') list = words.filter(w => w.nextReviewDate && w.nextReviewDate <= now && !w.isMastered);
    
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(w => 
      w.term.toLowerCase().includes(q) || 
      w.meaning.toLowerCase().includes(q)
    );
  }, [words, searchQuery, filter, now]);

  const getProgress = (level: EikenLevel) => {
    const levelWords = words.filter(w => w.level === level);
    if (levelWords.length === 0) return 0;
    return Math.round((levelWords.filter(w => w.isMastered).length / levelWords.length) * 100);
  };

  const getLevelStyles = (level: EikenLevel) => {
    switch (level) {
      case EikenLevel.GRADE_3: return 'level-3-grad shadow-emerald-100';
      case EikenLevel.GRADE_PRE_2: return 'level-pre2-grad shadow-sky-100';
      case EikenLevel.GRADE_2: return 'level-2-grad shadow-indigo-100';
      case EikenLevel.GRADE_PRE_1: return 'level-pre1-grad shadow-amber-100';
      case EikenLevel.GRADE_1: return 'level-1-grad shadow-rose-100';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700 pb-10">
      {/* Review Alert Card */}
      {reviewCount > 0 && (
        <div 
          onClick={() => onSelectLevel('REVIEW')}
          className="gradient-danger rounded-[3rem] p-8 md:p-12 text-white shadow-2xl shadow-rose-200 relative overflow-hidden cursor-pointer bounce-on-click group"
        >
          <div className="absolute -right-4 -top-4 w-64 h-64 bg-white/20 rounded-full blur-[80px] group-hover:scale-125 transition duration-700"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 backdrop-blur-md">
                <span className="animate-pulse">●</span> Spaced Repetition Active
              </div>
              <h2 className="text-3xl md:text-5xl font-black leading-tight tracking-tighter">{reviewCount} 単語の復習タイム！</h2>
              <p className="text-rose-50 text-sm md:text-base mt-4 font-bold opacity-90">忘却曲線を味方に。今復習するのが最も効率的です 🚀</p>
            </div>
            <div className="bg-white/20 backdrop-blur-xl p-8 rounded-[3rem] shadow-inner border border-white/30 group-hover:rotate-12 transition duration-500 shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">総単語数</span>
          <span className="text-3xl font-black text-slate-800">{words.length}</span>
        </div>
        <div className="bg-emerald-50 p-6 rounded-[2rem] shadow-sm border border-emerald-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">暗記完了</span>
          <span className="text-3xl font-black text-emerald-600">{masteredCount}</span>
        </div>
        <div className="bg-rose-50 p-6 rounded-[2rem] shadow-sm border border-rose-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">苦手単語</span>
          <span className="text-3xl font-black text-rose-600">{weakCount}</span>
        </div>
        <div className="bg-indigo-50 p-6 rounded-[2rem] shadow-sm border border-indigo-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">要復習</span>
          <span className="text-3xl font-black text-indigo-600">{reviewCount}</span>
        </div>
      </div>

      {/* Progress Section */}
      <section>
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tighter">英検レベル別</h3>
            <p className="text-slate-400 font-bold mt-1">各レベルの進捗状況</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
          {levels.map((level) => {
            const progress = getProgress(level);
            return (
              <button
                key={level}
                onClick={() => onSelectLevel(level)}
                className={`${getLevelStyles(level)} p-6 lg:p-8 rounded-[2.5rem] text-white shadow-xl text-left hover:scale-[1.05] hover:shadow-2xl transition-all duration-300 bounce-on-click relative overflow-hidden group h-full`}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition duration-700"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start mb-10">
                     <span className="text-2xl md:text-3xl font-black drop-shadow-md">{level}</span>
                     <div className="bg-black/10 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black">{progress}%</div>
                  </div>
                  <div className="w-full bg-black/10 h-3 rounded-full overflow-hidden backdrop-blur-sm border border-white/10 p-0.5">
                    <div 
                      className="bg-white h-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.7)] rounded-full" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Word List Controls */}
      <section className="glass-card rounded-[3.5rem] p-8 md:p-12 shadow-2xl">
        <div className="flex flex-col lg:flex-row gap-8 lg:items-center justify-between mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">単語コレクション</h3>
            <div className="flex p-1.5 bg-slate-100/50 rounded-2xl w-fit">
              {(['all', 'review', 'weak', 'mastered'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${
                    filter === f ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {f === 'all' ? '全部' : f === 'review' ? '復習' : f === 'weak' ? '苦手' : '完了'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group lg:w-96">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-300 group-focus-within:text-indigo-500 transition"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm md:text-base font-bold focus:ring-8 focus:ring-indigo-500/5 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
          {filteredWords.map(word => (
            <div 
              key={word.id} 
              onClick={() => onViewWord(word)}
              className="p-6 bg-white border border-slate-50 rounded-[2.2rem] flex justify-between items-center hover:shadow-2xl hover:scale-[1.02] transition-all bounce-on-click cursor-pointer group"
            >
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl transition-all duration-500 ${
                  word.isMastered 
                    ? 'bg-emerald-100 text-emerald-500 rotate-6' 
                    : (word.difficultyScore || 0) > 20
                    ? 'bg-rose-100 text-rose-500'
                    : (word.nextReviewDate && word.nextReviewDate <= now) 
                    ? 'bg-amber-100 text-amber-500 animate-pulse' 
                    : 'bg-slate-50 text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-500'
                }`}>
                  {word.isMastered ? '✓' : (word.difficultyScore || 0) > 20 ? '🔥' : (word.nextReviewDate && word.nextReviewDate <= now) ? '⏰' : '•'}
                </div>
                <div>
                  <p className="font-black text-slate-700 text-xl leading-tight group-hover:text-indigo-600 transition">{word.term}</p>
                  <p className="text-sm text-slate-400 font-bold mt-1.5">{word.meaning}</p>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm ${
                word.level === EikenLevel.GRADE_1 ? 'bg-rose-50 text-rose-500' :
                word.level === EikenLevel.GRADE_PRE_1 ? 'bg-amber-50 text-amber-500' :
                word.level === EikenLevel.GRADE_2 ? 'bg-indigo-50 text-indigo-500' :
                'bg-slate-100 text-slate-400'
              }`}>
                {word.level}
              </div>
            </div>
          ))}
          {filteredWords.length === 0 && (
            <div className="col-span-full text-center py-20">
              <h4 className="text-xl font-black text-slate-300">単語が見つかりませんでした</h4>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
