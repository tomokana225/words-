
import React, { useState } from 'react';
import { UserStats, ShopItem } from '../types';

interface ShopViewProps {
  stats: UserStats;
  onPurchase: (item: ShopItem) => void;
  onGacha: (items: ShopItem[]) => void;
  onBack: () => void;
}

interface GachaItem extends ShopItem {
  rarity: 'N' | 'R' | 'SR' | 'SEC';
}

const ShopView: React.FC<ShopViewProps> = ({ stats, onPurchase, onGacha, onBack }) => {
  const [isGachaRolling, setIsGachaRolling] = useState(false);
  const [gachaResult, setGachaResult] = useState<GachaItem | null>(null);
  const [showRates, setShowRates] = useState(false);

  const shopItems: ShopItem[] = [
    { id: 'av-p-1', name: '聖騎士パラディン', price: 500, type: 'avatar', preview: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Paladin&flip=true' },
    { id: 'av-p-2', name: '混沌の魔導士', price: 500, type: 'avatar', preview: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Warlock' },
    { id: 'av-p-3', name: '影の暗殺者', price: 650, type: 'avatar', preview: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Assassin' },
    { id: 'av-p-4', name: '黄金の姫君', price: 650, type: 'avatar', preview: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=Princess' },
    { id: 'av-p-5', name: 'サイバー忍者', price: 800, type: 'avatar', preview: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=CyberNinja' },
    { id: 'av-p-10', name: '光輝の国王', price: 2000, type: 'avatar', preview: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=GrandKing' },

    { id: 'av-a-1', name: '柴犬丸', price: 400, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Shiba' },
    { id: 'av-a-2', name: '三毛猫ミケ', price: 400, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Cat' },
    { id: 'av-a-4', name: '雪うさぎ', price: 450, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Rabbit' },
    { id: 'av-a-5', name: '銀狐', price: 650, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Fox' },
    { id: 'av-a-6', name: '蒼き狼', price: 800, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Wolf' },
    { id: 'av-a-9', name: '百獣の王', price: 1200, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Lion' },
    { id: 'av-a-10', name: 'レッサーパンダ', price: 950, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=RedPanda' },

    { id: 'av-s-1', name: '次世代アンドロイド', price: 1500, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=AndroidX' },
    { id: 'av-s-4', name: 'メタルスライム', price: 900, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Slime' },
    { id: 'av-s-5', name: '聖獣ユニコーン', price: 3000, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Unicorn' },
    { id: 'av-s-7', name: '古代龍ドラグーン', price: 4500, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Dragon' },
    { id: 'av-s-15', name: '深淵の魔神クラーケン', price: 5000, type: 'avatar', preview: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=Kraken' },
  ];

  const gachaPool: GachaItem[] = [
    { id: 'acc-ribbon', name: '赤いリボン', price: 0, type: 'accessory', rarity: 'N', preview: '🎀' },
    { id: 'acc-balloon', name: 'お祝い風船', price: 0, type: 'accessory', rarity: 'N', preview: '🎈' },
    { id: 'acc-medal-3', name: '3級メダル', price: 0, type: 'accessory', rarity: 'N', preview: '🥉' },
    { id: 'acc-crown', name: '黄金の王冠', price: 0, type: 'accessory', rarity: 'R', preview: '👑' },
    { id: 'acc-pet-dog', name: '相棒の柴犬', price: 0, type: 'accessory', rarity: 'SR', preview: '🐕' },
    { id: 'sec-dragon', name: '伝説のドット龍', price: 0, type: 'accessory', rarity: 'SEC', preview: '🐉' },
  ];

  const handleRollGacha = () => {
    if (stats.coins < 300) return;
    setIsGachaRolling(true);
    setGachaResult(null);

    setTimeout(() => {
      const rand = Math.random() * 100;
      let targetRarity: 'N' | 'R' | 'SR' | 'SEC' = 'N';
      if (rand < 2) targetRarity = 'SEC';
      else if (rand < 10) targetRarity = 'SR';
      else if (rand < 30) targetRarity = 'R';
      else targetRarity = 'N';

      const pool = gachaPool.filter(item => item.rarity === targetRarity);
      const result = pool[Math.floor(Math.random() * pool.length)];
      setGachaResult(result);
      onGacha([result]);
      setIsGachaRolling(false);
    }, 2000);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'SEC': return 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]';
      case 'SR': return 'text-purple-400';
      case 'R': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  const categories = [
    { name: 'ファンタジー', items: shopItems.filter(i => i.id.startsWith('av-s')) },
    { name: '冒険者', items: shopItems.filter(i => i.id.startsWith('av-p')) },
    { name: 'アニマル', items: shopItems.filter(i => i.id.startsWith('av-a')) },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10 animate-view">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-900 transition lg:hidden">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">ドット絵ショップ</h2>
          </div>
        </div>
        <div className="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 flex items-center gap-2 shadow-sm">
          <span className="text-amber-600 font-bold">{stats.coins}</span>
          <span className="text-lg">🪙</span>
        </div>
      </header>

      {/* ガチャエリア */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="space-y-1">
             <h3 className="text-2xl font-bold tracking-tight">ドット・マスターガチャ</h3>
             <button onClick={() => setShowRates(true)} className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition underline underline-offset-4">提供割合を確認する</button>
          </div>
          
          <div className={`w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10 text-6xl shadow-inner relative group transition-all duration-500`}>
            {isGachaRolling ? (
              <div className="animate-bounce">🎁</div>
            ) : gachaResult ? (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                <span>{gachaResult.preview}</span>
                <span className={`text-[8px] font-black mt-2 tracking-tighter ${getRarityColor(gachaResult.rarity)}`}>
                  {gachaResult.rarity}
                </span>
              </div>
            ) : (
              <div className="opacity-20 group-hover:opacity-40 transition">👾</div>
            )}
            {isGachaRolling && (
              <div className="absolute inset-0 rounded-[2.5rem] border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            )}
          </div>

          <button 
            disabled={stats.coins < 300 || isGachaRolling}
            onClick={handleRollGacha}
            className={`w-full max-w-xs py-4 rounded-2xl font-bold text-base transition-all bounce-on-click flex items-center justify-center gap-3 ${
              stats.coins >= 300 && !isGachaRolling ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' : 'bg-white/5 text-white/20 cursor-not-allowed'
            }`}
          >
            300 🪙 でガチャを回す
          </button>
        </div>
      </section>

      {/* 提供割合モーダル */}
      {showRates && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowRates(false)}></div>
          <div className="relative bg-white rounded-[2rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
             <h4 className="text-xl font-black text-slate-900 mb-6">ガチャ提供割合</h4>
             <div className="space-y-4">
                {[
                  { r: 'SEC', d: 'Secret', p: '2.0 %', c: 'text-amber-500' },
                  { r: 'SR', d: 'Super Rare', p: '8.0 %', c: 'text-purple-500' },
                  { r: 'R', d: 'Rare', p: '20.0 %', c: 'text-blue-500' },
                  { r: 'N', d: 'Normal', p: '70.0 %', c: 'text-slate-400' }
                ].map(row => (
                  <div key={row.r} className="flex justify-between items-center pb-3 border-b border-slate-50">
                     <div className="flex items-center gap-2">
                        <span className={`${row.c} font-black`}>{row.r}</span>
                        <span className="text-xs font-bold text-slate-500">{row.d}</span>
                     </div>
                     <span className="font-black text-slate-900">{row.p}</span>
                  </div>
                ))}
             </div>
             <button onClick={() => setShowRates(false)} className="w-full mt-8 py-4 bg-slate-100 text-slate-600 rounded-xl font-black text-sm">閉じる</button>
          </div>
        </div>
      )}

      <div className="space-y-10">
        {categories.map((cat) => (
          <section key={cat.name} className="space-y-4">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest px-1 border-l-4 border-indigo-600 pl-3">
              {cat.name}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cat.items.map((item) => {
                const isOwned = stats.unlockedItems.includes(item.id);
                const canAfford = stats.coins >= item.price;
                return (
                  <div key={item.id} className="bg-white rounded-[2rem] border border-slate-200 p-3 flex flex-col items-center gap-2 shadow-sm hover:shadow-md transition group">
                    <div className="w-full aspect-square bg-slate-50 rounded-[1.5rem] flex items-center justify-center border border-slate-100 overflow-hidden shadow-inner group-hover:scale-105 transition duration-300">
                      <img src={item.preview} className="w-full h-full object-contain p-2" alt={item.name} />
                    </div>
                    <div className="text-center space-y-0.5">
                      <p className="font-bold text-slate-800 text-[10px] truncate w-full px-1">{item.name}</p>
                      <p className="text-[9px] font-bold text-amber-600">{item.price} 🪙</p>
                    </div>
                    <button
                      disabled={isOwned || !canAfford}
                      onClick={() => onPurchase(item)}
                      className={`w-full py-2.5 rounded-xl font-bold text-[10px] transition-all bounce-on-click ${
                        isOwned ? 'bg-emerald-50 text-emerald-600' : canAfford ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-300'
                      }`}
                    >
                      {isOwned ? '入手済み' : '購入'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ShopView;
