
import React from 'react';
import { Word, EikenLevel, UserStats, MasteryStatus } from '../types';
import { User } from 'firebase/auth';

interface DashboardProps {
  user: User | null;
  stats: UserStats;
  words: Word[];
  onSelectLevel: (level: EikenLevel | 'ALL' | 'REVIEW' | 'WEAK' | MasteryStatus) => void;
  onViewWord: (word: Word) => void;
  onGoShop: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, stats, words, onSelectLevel, onViewWord, onGoShop }) => {
  const now = Date.now();
  
  const getMasteryStatus = (w: Word): MasteryStatus => {
    if ((w.masteryCount || 0) >= 4) return MasteryStatus.MASTERED;
    if (w.lastWasCorrect === false || (w.difficultyScore || 0) > 30) return MasteryStatus.WEAK;
    if ((w.masteryCount || 0) > 0) return MasteryStatus.UNSTABLE;
    return MasteryStatus.UNLEARNED;
  };

  const reviewWords = words.filter(w => (w.masteryCount || 0) < 4 && w.nextReviewDate && w.nextReviewDate <= now);
  const reviewCount = reviewWords.length;
  
  const levels = Object.values(EikenLevel);
  const masteredCount = words.filter(w => (w.masteryCount || 0) >= 4).length;
  const masteryRate = words.length > 0 ? Math.round((masteredCount / words.length) * 100) : 0;

  const statusCounts = {
    [MasteryStatus.UNLEARNED]: words.filter(w => getMasteryStatus(w) === MasteryStatus.UNLEARNED).length,
    [MasteryStatus.WEAK]: words.filter(w => getMasteryStatus(w) === MasteryStatus.WEAK).length,
    [MasteryStatus.UNSTABLE]: words.filter(w => getMasteryStatus(w) === MasteryStatus.UNSTABLE).length,
    [MasteryStatus.MASTERED]: masteredCount,
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  const currentLevelXp = stats.xp % 100;

  return (
    <div className="flex flex-col h-full space-y-4 pb-20 lg:pb-6 overflow-hidden">
      {/* 1. ステータスバー */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-indigo-100 shadow-lg">
            {stats.level}
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
      <div className="flex items-center justify-between px-1 flex-shrink-0">
        <div className="flex items-center gap-3">
          <img src={stats.activeAvatar} className="w-12 h-12 rounded-full border-2 border-white shadow-md bg-slate-100" alt="User" />
          <div>
            <p className="text-sm font-bold text-slate-800 leading-none mb-1">こんにちは、{user?.displayName?.split(' ')[0] || 'ゲスト'}さん</p>
            <p className="text-[10px] font-medium text-slate-400">英検合格を目指して今日も学習しましょう！</p>
          </div>
        </div>
      </div>

      {/* 3. 習熟度別要約エリア */}
      <div className="grid grid-cols-4 gap-2 flex-shrink-0">
        {[
          { status: MasteryStatus.UNLEARNED, count: statusCounts[MasteryStatus.UNLEARNED], color: 'bg-slate-100 text-slate-400' },
          { status: MasteryStatus.WEAK, count: statusCounts[MasteryStatus.WEAK], color: 'bg-rose-100 text-rose-600' },
          { status: MasteryStatus.UNSTABLE, count: statusCounts[MasteryStatus.UNSTABLE], color: 'bg-amber-100 text-amber-600' },
          { status: MasteryStatus.MASTERED, count: statusCounts[MasteryStatus.MASTERED], color: 'bg-emerald-100 text-emerald-600' }
        ].map(item => (
          <button 
            key={item.status}
            onClick={() => onSelectLevel(item.status)}
            className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-1 hover:border-indigo-300 transition bounce-on-click"
          >
            <span className={`text-lg font-black ${item.color.split(' ')[1]}`}>{item.count}</span>
            <span className="text-[8px] font-bold text-slate-400 uppercase">{item.status}</span>
          </button>
        ))}
      </div>

      {/* 4. メインボタン */}
      <div className="grid grid-cols-2 gap-3 h-[100px] flex-shrink-0">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">暗記率</span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-slate-900">{masteryRate}</span>
            <span className="text-sm font-bold text-slate-400">%</span>
          </div>
          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
            <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${masteryRate}%` }} />
          </div>
        </div>

        <button 
          onClick={() => onSelectLevel('REVIEW')}
          className={`p-4 rounded-2xl border shadow-sm transition-all flex flex-col justify-between text-left bounce-on-click ${
            reviewCount > 0 ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200'
          }`}
        >
          <span className={`text-[10px] font-bold uppercase tracking-widest block ${reviewCount > 0 ? 'text-indigo-200' : 'text-slate-400'}`}>
            復習アラート
          </span>
          <span className={`text-3xl font-black ${reviewCount > 0 ? 'text-white' : 'text-slate-900'}`}>{reviewCount}</span>
          <p className={`text-[9px] font-medium ${reviewCount > 0 ? 'text-indigo-100' : 'text-slate-400'}`}>
            {reviewCount > 0 ? '忘却曲線が警告中！' : '全て暗記済みです'}
          </p>
        </button>
      </div>

      {/* 5. 英検レベル選択 */}
      <div className="space-y-3 flex-shrink-0">
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
                  style={{ width: `${words.length > 0 ? Math.round((words.filter(w => w.level === level && (w.masteryCount || 0) >= 4).length / Math.max(1, words.filter(w => w.level === level).length)) * 100) : 0}%` }} 
                />
              </div>
            </button>
          ))}
          <button onClick={() => onSelectLevel('ALL')} className="bg-slate-50 py-3 px-2 rounded-xl border border-dashed border-slate-300 text-slate-400 text-[10px] font-bold hover:bg-white transition-all">全単語</button>
        </div>
      </div>

      {/* 6. 最近学習した単語 */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1 mb-2">最近の学習</h3>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-y-auto custom-scrollbar flex-1">
          {words.length > 0 ? (
            words.slice(-10).reverse().map((word, i, arr) => (
              <div 
                key={word.id} 
                onClick={() => onViewWord(word)}
                className={`px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition cursor-pointer ${i !== arr.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${getMasteryStatus(word) === MasteryStatus.MASTERED ? 'bg-emerald-500' : getMasteryStatus(word) === MasteryStatus.WEAK ? 'bg-rose-500' : 'bg-slate-300'}`}></div>
                  <span className="text-sm font-bold text-slate-700">{word.term}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[1,2,3,4].map(step => (
                      <div key={step} className={`w-1 h-1 rounded-full ${step <= (word.masteryCount || 0) ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                    ))}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 truncate max-w-[100px]">{word.meaning}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center opacity-30 text-xs font-bold">まだ学習記録がありません</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
