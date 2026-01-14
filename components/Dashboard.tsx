
import React, { useState, useMemo } from 'react';
import { Word, EikenLevel } from '../types';

interface DashboardProps {
  words: Word[];
  onStartQuiz: (level: EikenLevel | 'ALL' | 'REVIEW') => void;
  onViewWord: (word: Word) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ words, onStartQuiz, onViewWord }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'mastered' | 'weak' | 'review'>('all');

  const now = Date.now();
  const reviewCount = words.filter(w => w.nextReviewDate && w.nextReviewDate <= now && !w.isMastered).length;
  const masteredCount = words.filter(w => w.isMastered).length;
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

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
      {/* Review Alert Card */}
      {reviewCount > 0 && (
        <div 
          onClick={() => onStartQuiz('REVIEW')}
          className="bg-rose-500 rounded-[2rem] p-6 text-white shadow-xl shadow-rose-200 relative overflow-hidden cursor-pointer bounce-on-click"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-rose-100 font-bold text-sm mb-1 uppercase tracking-tighter">忘却曲線に基づく復習</p>
              <h2 className="text-2xl font-black">{reviewCount} 単語が復習待ち！</h2>
              <p className="text-rose-100 text-xs mt-2 font-medium">今復習すると記憶が定着しやすくなります ✨</p>
            </div>
            <div className="bg-white text-rose-500 p-3 rounded-2xl shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
            </div>
          </div>
        </div>
      )}

      {/* Progress Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-800">各級の習得状況</h3>
          <span className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">{masteredCount} / {words.length} 完了</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {levels.map((level) => {
            const progress = getProgress(level);
            return (
              <button
                key={level}
                onClick={() => onStartQuiz(level)}
                className="p-5 rounded-[1.8rem] bg-white border border-slate-100 shadow-sm text-left hover:border-indigo-200 transition-all bounce-on-click"
              >
                <div className="flex justify-between items-start mb-3">
                   <span className="text-xl font-black text-slate-700">{level}</span>
                   <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">{progress}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-1000" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Word List Controls */}
      <section className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">マイ単語帳</h3>
            <div className="flex gap-1">
              {(['all', 'review', 'weak', 'mastered'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition ${
                    filter === f ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {f === 'all' ? '全部' : f === 'review' ? '復習' : f === 'weak' ? '苦手' : '完了'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <input 
              type="text"
              placeholder="単語を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredWords.map(word => (
            <div 
              key={word.id} 
              onClick={() => onViewWord(word)}
              className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:shadow-md transition bounce-on-click cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                  word.isMastered ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-50 text-slate-400'
                }`}>
                  {word.isMastered ? '✓' : (word.nextReviewDate && word.nextReviewDate <= now) ? '⏰' : '•'}
                </div>
                <div>
                  <p className="font-black text-slate-700 leading-none">{word.term}</p>
                  <p className="text-xs text-slate-400 font-bold mt-1">{word.meaning}</p>
                </div>
              </div>
              <div className="text-[10px] font-black text-slate-300 uppercase">{word.level}</div>
            </div>
          ))}
          {filteredWords.length === 0 && (
            <div className="text-center py-12 text-slate-300 font-bold">該当する単語がありません</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
