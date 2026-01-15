
import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Word, UserStats } from '../types';

interface MyPageViewProps {
  user: User | null;
  stats: UserStats;
  words: Word[];
  onLogout: () => void;
  onLogin: () => void;
  onAdmin: () => void;
  isAdmin: boolean;
  onBack: () => void;
  onSelectItem: (id: string) => void;
}

const MyPageView: React.FC<MyPageViewProps> = ({ user, stats, words, onLogout, onLogin, onAdmin, isAdmin, onBack, onSelectItem }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'gallery'>('stats');
  const masteredCount = words.filter(w => w.isMastered).length;
  
  // ショップ側の新スタイルと同期
  const avatars = [
    { id: 'default-avatar', name: 'デフォルト', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Felix' },
    // 冒険者 (人間)
    { id: 'av-p-1', name: '聖騎士パラディン', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Paladin&flip=true' },
    { id: 'av-p-2', name: '混沌の魔導士', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Warlock' },
    { id: 'av-p-3', name: '影の暗殺者', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Assassin' },
    { id: 'av-p-4', name: '黄金の姫君', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Princess' },
    { id: 'av-p-5', name: 'サイバー忍者', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=CyberNinja' },
    { id: 'av-p-10', name: '光輝の国王', url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=GrandKing' },
    // 精細アニマル (非人間)
    { id: 'av-a-1', name: '柴犬丸', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Shiba' },
    { id: 'av-a-2', name: '三毛猫ミケ', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Cat' },
    { id: 'av-a-4', name: '雪うさぎ', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Rabbit' },
    { id: 'av-a-5', name: '銀狐', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Fox' },
    { id: 'av-a-6', name: '蒼き狼', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Wolf' },
    { id: 'av-a-9', name: '百獣の王', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Lion' },
    { id: 'av-a-10', name: 'レッサーパンダ', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=RedPanda' },
    { id: 'av-a-11', name: '皇帝ペンギン', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Penguin' },
    { id: 'av-a-12', name: 'ウーパールーパー', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Axolotl' },
    { id: 'av-a-15', name: '深海のシャチ', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Orca' },
    // 幻獣・スペシャル (非人間)
    { id: 'av-s-1', name: '次世代アンドロイド', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=AndroidX' },
    { id: 'av-s-4', name: 'メタルスライム', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Slime' },
    { id: 'av-s-5', name: '聖獣ユニコーン', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Unicorn' },
    { id: 'av-s-7', name: '古代龍ドラグーン', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Dragon' },
    { id: 'av-s-15', name: '深淵の魔神クラーケン', url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Kraken' },
  ];

  const gachaItems = [
    { id: 'acc-ribbon', name: '赤いリボン', preview: '🎀', rarity: 'N' },
    { id: 'acc-balloon', name: 'お祝い風船', preview: '🎈', rarity: 'N' },
    { id: 'acc-medal-3', name: '3級メダル', preview: '🥉', rarity: 'N' },
    { id: 'acc-crown', name: '黄金の王冠', preview: '👑', rarity: 'R' },
    { id: 'acc-pet-dog', name: '相棒の柴犬', preview: '🐕', rarity: 'SR' },
    { id: 'sec-dragon', name: '伝説のドット龍', preview: '🐉', rarity: 'SEC' },
  ];

  const getRarityClass = (rarity: string) => {
    switch (rarity) {
      case 'SEC': return 'border-amber-400 bg-amber-50 text-amber-600 shadow-amber-100 shadow-lg';
      case 'SR': return 'border-purple-300 bg-purple-50 text-purple-600';
      case 'R': return 'border-blue-300 bg-blue-50 text-blue-600';
      default: return 'border-slate-200 bg-white text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-view max-w-2xl mx-auto pb-10">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-900 transition lg:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">マイページ</h2>
          <p className="text-xs font-medium text-slate-500">あなたの軌跡とコレクション</p>
        </div>
      </header>

      {/* プロフィール */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm flex flex-col items-center text-center gap-4">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full shadow-2xl border-4 border-white bg-indigo-50 overflow-hidden group-hover:scale-105 transition-transform">
            <img src={stats.activeAvatar} className="w-full h-full object-contain p-2" alt="Profile" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white w-8 h-8 rounded-full border-4 border-white flex items-center justify-center font-bold text-xs shadow-lg">
            {stats.level}
          </div>
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900">{user?.displayName || '学習者'}さん</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">RANK: {stats.level}</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-bold border border-amber-100 flex items-center gap-2">
            <span>🪙</span> {stats.coins}
          </div>
        </div>
      </div>

      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-10">
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'stats' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
        >
          学習データ
        </button>
        <button 
          onClick={() => setActiveTab('gallery')}
          className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'gallery' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}
        >
          コレクション
        </button>
      </div>

      {activeTab === 'stats' ? (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">マスター単語</p>
              <p className="text-4xl font-bold text-slate-900">{masteredCount}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">総学習</p>
              <p className="text-4xl font-bold text-indigo-600">{Math.floor(stats.totalStudyTime / 60)}</p>
              <p className="text-[10px] text-slate-400 font-medium">分間</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full py-4 text-rose-500 font-bold text-sm bg-rose-50 rounded-2xl border border-rose-100 hover:bg-rose-100 transition bounce-on-click">
            ログアウト
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 pb-12">
          {/* アバターセクション */}
          <section className="space-y-4">
             <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest px-1">マイ・アバター</h4>
             <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                {avatars.filter(a => stats.unlockedItems.includes(a.id)).map(a => (
                  <button
                    key={a.id}
                    onClick={() => onSelectItem(a.url)}
                    className={`aspect-square rounded-[1.5rem] border-2 transition-all overflow-hidden flex items-center justify-center p-1 bg-white shadow-sm ${stats.activeAvatar === a.url ? 'border-indigo-600 ring-4 ring-indigo-50 scale-105' : 'border-slate-100 hover:border-indigo-200'}`}
                  >
                    <img src={a.url} alt={a.name} className="w-full h-full object-contain p-2" />
                  </button>
                ))}
             </div>
          </section>

          {/* アイテムセクション */}
          <section className="space-y-4">
             <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest px-1">獲得したレアアイテム</h4>
             <div className="grid grid-cols-5 gap-3">
                {gachaItems.filter(i => stats.unlockedItems.includes(i.id)).map(i => (
                  <div 
                    key={i.id} 
                    className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center text-2xl shadow-sm hover:scale-105 transition-transform ${getRarityClass(i.rarity)}`}
                    title={i.name}
                  >
                    {i.preview}
                    <span className="text-[7px] mt-1 font-black truncate w-full text-center px-1 opacity-60 uppercase">{i.rarity === 'SEC' ? 'SEC' : i.name}</span>
                  </div>
                ))}
             </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default MyPageView;
