
import React from 'react';
import { Word, EikenLevel, UserStats } from '../types';
import { User } from 'firebase/auth';

interface DashboardProps {
  user: User | null;
  stats: UserStats;
  words: Word[];
  onSelectLevel: (level: EikenLevel | 'ALL' | 'REVIEW' | 'WEAK') => void;
  onViewWord: (word: Word) => void;
  onGoShop: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, stats, words, onSelectLevel, onViewWord, onGoShop }) => {
  const now = Date.now();
  const reviewWords = words.filter(w => w.nextReviewDate && w.nextReviewDate <= now && !w.isMastered);
  const reviewCount = reviewWords.length;
  
  const levels = Object.values(EikenLevel);
  const masteredCount = words.filter(w => w.isMastered).length;
  const masteryRate = words.length > 0 ? Math.round((masteredCount / words.length) * 100) : 0;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  const currentLevelXp = stats.xp % 100;

  return (
    <div className="flex flex-col h-full space-y-4 pb-4">
      {/* 1. ステータスバー (XP / Coins / Time) */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-indigo-100 shadow-lg">
              {stats.level}
            </div>
          </div>
          <div className="flex-1 max-w-[100px]">
            <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${currentLevelXp}%` }} />
            </div>
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 block">XP: {stats.xp}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
          <button onClick={onGoShop} className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100 hover:bg-amber-100 transition bounce-on-click">
             <span className="text-xs font-bold text-amber-700">{stats.coins}</span>
             <span className="text-sm">🪙</span>
          </button>
          <div className="flex items-center gap-1 border-l border-slate-100 pl-3">
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Time</span>
             <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{formatTime(stats.totalStudyTime)}</span>
          </div>
        </div>
      </div>

      {/* 2. プロフィール概要 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={stats.activeAvatar || user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'guest'}`} 
              className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-slate-100"
              alt="User"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 leading-none mb-1">こんにちは、{user?.displayName?.split(' ')[0] || 'ゲスト'}さん</p>
            <p className="text-[10px] font-medium text-slate-400">
               {stats.level >= 10 ? '🎖️ エキスパート' : stats.level >= 5 ? '🥉 チャレンジャー' : '🌱 ビギナー'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. メイン要約エリア */}
      <div className="grid grid-cols-2 gap-3 h-[150px]">
        {/* 進捗カード */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">学習進捗</span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-slate-900">{masteryRate}</span>
              <span className="text-sm font-bold text-slate-400">%</span>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${masteryRate}%` }} />
          </div>
        </div>

        {/* 復習ステータスカード */}
        <button 
          onClick={() => onSelectLevel('REVIEW')}
          className={`p-4 rounded-2xl border shadow-sm transition-all flex flex-col justify-between text-left bounce-on-click ${
            reviewCount > 0 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <div>
            <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${reviewCount > 0 ? 'text-indigo-200' : 'text-slate-400'}`}>
              復習待ち
            </span>
            <span className={`text-3xl font-bold ${reviewCount > 0 ? 'text-white' : 'text-slate-900'}`}>{reviewCount}</span>
          </div>
          <p className={`text-[9px] font-medium ${reviewCount > 0 ? 'text-indigo-100' : 'text-slate-400'}`}>
            {reviewCount > 0 ? '今すぐ挑戦！' : '完璧です'}
          </p>
        </button>
      </div>

      {/* 4. 学習レベル */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">英検レベル</h3>
        <div className="grid grid-cols-3 gap-2">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => onSelectLevel(level)}
              className="bg-white py-3 px-2 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all text-center flex flex-col items-center gap-1 group bounce-on-click"
            >
              <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600">{level}</span>
              <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-400 h-full" 
                  style={{ width: `${words.length > 0 ? Math.round((words.filter(w => w.level === level && w.isMastered).length / Math.max(1, words.filter(w => w.level === level).length)) * 100) : 0}%` }} 
                />
              </div>
            </button>
          ))}
          <button
            onClick={() => onSelectLevel('ALL')}
            className="bg-slate-50 py-3 px-2 rounded-xl border border-dashed border-slate-300 text-slate-400 text-[10px] font-bold hover:bg-white transition-all"
          >
            全単語
          </button>
        </div>
      </div>

      {/* 5. 最近の成果 */}
      <div className="flex-1 min-h-0 flex flex-col">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">最近学習した単語</h3>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
          {words.slice(-3).reverse().map((word, i) => (
            <div 
              key={word.id} 
              onClick={() => onViewWord(word)}
              className={`px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${i !== 2 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${word.isMastered ? 'bg-emerald-500 shadow-sm' : 'bg-rose-400'}`}></div>
                <span className="text-sm font-bold text-slate-700">{word.term}</span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 truncate max-w-[120px]">{word.meaning}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
