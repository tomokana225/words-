
import React, { useState, useMemo } from 'react';
import { Word, EikenLevel } from '../types';

interface DashboardProps {
  words: Word[];
  isAdmin: boolean;
  onSelectLevel: (level: EikenLevel | 'ALL' | 'REVIEW' | 'WEAK') => void;
  onViewWord: (word: Word) => void;
  onQuickAdd: (term: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ words, isAdmin, onSelectLevel, onViewWord, onQuickAdd }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'mastered' | 'weak' | 'review'>('all');

  const now = Date.now();
  const reviewCount = words.filter(w => w.nextReviewDate && w.nextReviewDate <= now && !w.isMastered).length;
  const masteredCount = words.filter(w => w.isMastered).length;
  const weakCount = words.filter(w => !w.isMastered && (w.difficultyScore || 0) > 20).length;
  
  const levels = Object.values(EikenLevel);

  const filteredWords = useMemo(() => {
    let list = words;
    if (filter === 'mastered') list = words.filter(w => w.isMastered);
    if (filter === 'weak') list = words.filter(w => !w.isMastered && (w.difficultyScore || 0) > 20);
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

  const isNewWord = isAdmin && searchQuery.length > 2 && !words.some(w => w.term.toLowerCase() === searchQuery.toLowerCase());

  return (
    <div className="space-y-8 md:space-y-12 animate-in slide-in-from-bottom-6 duration-500 pb-10">
      {/* Review Alert Card */}
      {reviewCount > 0 && (
        <div 
          onClick={() => onSelectLevel('REVIEW')}
          className="gradient-danger rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-12 text-white shadow-xl shadow-rose-200 relative overflow-hidden cursor-pointer bounce-on-click group"
        >
          <div className="absolute -right-4 -top-4 w-48 h-48 md:w-64 md:h-64 bg-white/20 rounded-full blur-[60px] group-hover:scale-125 transition duration-700"></div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-[9px] md:text-xs font-black uppercase tracking-widest mb-3 backdrop-blur-md">
                <span className="animate-pulse">●</span> Spaced Repetition
              </div>
              <h2 className="text-2xl md:text-5xl font-black leading-tight tracking-tighter">{reviewCount} 単語の復習タイム！</h2>
              <p className="text-rose-50 text-xs md:text-base mt-2 md:mt-4 font-bold opacity-90">今復習するのが最も効率的です 🚀</p>
            </div>
            <div className="bg-white/20 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] shadow-inner border border-white/30 hidden sm:block">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: '総単語数', val: words.length, bg: 'bg-white', text: 'text-slate-800' },
          { label: '暗記完了', val: masteredCount, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
          { label: '苦手単語', val: weakCount, bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', click: 'WEAK' },
          { label: '要復習', val: reviewCount, bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', click: 'REVIEW' },
        ].map((s, i) => (
          <div 
            key={i} 
            onClick={s.click ? () => onSelectLevel(s.click as any) : undefined}
            className={`${s.bg} p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border ${s.border || 'border-slate-100'} flex flex-col items-center transition hover:scale-[1.03] ${s.click ? 'cursor-pointer' : ''}`}
          >
            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 md:mb-2">{s.label}</span>
            <span className={`text-xl md:text-3xl font-black ${s.text}`}>{s.val}</span>
          </div>
        ))}
      </div>

      {/* Progress Section */}
      <section>
        <div className="flex justify-between items-end mb-6 px-2">
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tighter">レベル別進捗</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-6">
          {levels.map((level) => {
            const progress = getProgress(level);
            return (
              <button
                key={level}
                onClick={() => onSelectLevel(level)}
                className={`${getLevelStyles(level)} p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-lg text-left hover:scale-[1.05] transition-all relative overflow-hidden h-full group`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl group-hover:scale-150 transition duration-700"></div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start mb-6 md:mb-10">
                     <span className="text-xl md:text-3xl font-black">{level}</span>
                     <div className="bg-black/10 backdrop-blur-md px-2 py-1 rounded-lg text-[9px] md:text-xs font-black">{progress}%</div>
                  </div>
                  <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden backdrop-blur-sm border border-white/10">
                    <div 
                      className="bg-white h-full transition-all duration-1000 rounded-full" 
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
      <section className="glass-card rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-12 shadow-xl border border-white/50">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8 lg:items-center justify-between mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">単語コレクション</h3>
            <div className="flex p-1 bg-slate-100/50 rounded-xl md:rounded-2xl w-fit">
              {(['all', 'review', 'weak', 'mastered'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 md:px-4 py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase transition-all ${
                    filter === f ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-400'
                  }`}
                >
                  {f === 'all' ? '全部' : f === 'review' ? '復習' : f === 'weak' ? '苦手' : '完了'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative group lg:w-96">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-300 group-focus-within:text-indigo-500 transition"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text"
              placeholder="単語を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] md:rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {isAdmin && isNewWord && (
          <div className="mb-6 p-5 bg-indigo-600 rounded-[1.5rem] md:rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
               <span className="text-2xl">✨</span>
               <div>
                 <p className="font-black text-sm md:text-base">"{searchQuery}" をAI解析して追加しますか？</p>
               </div>
            </div>
            <button 
              onClick={() => onQuickAdd(searchQuery)}
              className="px-6 py-2 bg-white text-indigo-600 rounded-full font-black text-xs hover:scale-105 transition shrink-0"
            >
              AI解析を実行
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredWords.map(word => (
            <div 
              key={word.id} 
              onClick={() => onViewWord(word)}
              className="p-5 bg-white border border-slate-50 rounded-[1.8rem] md:rounded-[2.2rem] flex justify-between items-center hover:shadow-lg transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-4 md:gap-6">
                <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center font-black text-lg md:text-xl ${
                  word.isMastered 
                    ? 'bg-emerald-100 text-emerald-500' 
                    : (word.difficultyScore || 0) > 20
                    ? 'bg-rose-100 text-rose-500'
                    : (word.nextReviewDate && word.nextReviewDate <= now) 
                    ? 'bg-amber-100 text-amber-500 animate-pulse' 
                    : 'bg-slate-50 text-slate-300 group-hover:text-indigo-500'
                }`}>
                  {word.isMastered ? '✓' : (word.difficultyScore || 0) > 20 ? '🔥' : (word.nextReviewDate && word.nextReviewDate <= now) ? '⏰' : '•'}
                </div>
                <div>
                  <p className="font-black text-slate-700 text-base md:text-xl leading-tight group-hover:text-indigo-600 transition">{word.term}</p>
                  <p className="text-[10px] md:text-sm text-slate-400 font-bold mt-1">{word.meaning}</p>
                </div>
              </div>
              <div className="text-[9px] md:text-[10px] px-2 py-0.5 md:py-1 rounded-lg bg-slate-50 text-slate-400 font-black">
                {word.level}
              </div>
            </div>
          ))}
          {filteredWords.length === 0 && !isNewWord && (
            <div className="col-span-full text-center py-12">
              <p className="text-slate-300 font-bold text-sm">単語が見つかりませんでした</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
