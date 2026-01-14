
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

  // ピクセルアバター（直接購入可能）- 15種類追加し合計38種類に拡充
  const shopItems: ShopItem[] = [
    // --- 冒険者シリーズ ---
    { id: 'av-p-1', name: 'ピクセル勇者', price: 300, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Hero' },
    { id: 'av-p-2', name: 'ピクセル魔導士', price: 300, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Mage' },
    { id: 'av-p-3', name: 'ドット戦士', price: 450, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Warrior' },
    { id: 'av-p-4', name: 'ピクセル姫', price: 450, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Princess' },
    { id: 'av-p-5', name: 'ドット忍者', price: 500, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ninja' },
    { id: 'av-p-6', name: 'ピクセル農夫', price: 500, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Farmer' },
    { id: 'av-p-7', name: 'ドット侍', price: 600, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Samurai' },
    { id: 'av-p-8', name: 'ピクセル錬金術師', price: 750, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Alchemist' },
    { id: 'av-p-9', name: 'ドット学者', price: 800, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Professor' },
    { id: 'av-p-10', name: 'ピクセル王', price: 1000, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=King' },

    // --- アニマルシリーズ ---
    { id: 'av-a-1', name: 'ドットわんこ', price: 400, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Dog' },
    { id: 'av-a-2', name: 'ドットにゃんこ', price: 400, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Cat' },
    { id: 'av-a-3', name: 'ピクセル小鳥', price: 350, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Bird' },
    { id: 'av-a-4', name: 'ドットうさぎ', price: 450, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Rabbit' },
    { id: 'av-a-5', name: 'ピクセル狐', price: 550, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Fox' },
    { id: 'av-a-6', name: 'ドット狼', price: 700, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Wolf' },
    { id: 'av-a-7', name: 'ピクセル熊', price: 650, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Bear' },
    { id: 'av-a-8', name: 'ドットカエル', price: 300, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Frog' },
    { id: 'av-a-9', name: 'ピクセルライオン', price: 900, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Lion' },
    { id: 'av-a-10', name: 'ドットパンダ', price: 850, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Panda' },
    { id: 'av-a-11', name: 'ピクセルペンギン', price: 500, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Penguin' },
    { id: 'av-a-12', name: 'ドットコアラ', price: 700, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Koala' },
    { id: 'av-a-13', name: 'ピクセル象', price: 1100, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Elephant' },
    { id: 'av-a-14', name: 'ドット梟', price: 600, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Owl' },

    // --- スペシャル・幻獣シリーズ ---
    { id: 'av-s-1', name: 'ドットロボ', price: 1000, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Robot' },
    { id: 'av-s-2', name: 'ピクセル宇宙人', price: 1200, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Alien' },
    { id: 'av-s-3', name: 'ドットおばけ', price: 800, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Ghost' },
    { id: 'av-s-4', name: 'ピクセルスライム', price: 500, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Slime' },
    { id: 'av-s-5', name: 'ドットユニコーン', price: 2500, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Unicorn' },
    { id: 'av-s-6', name: 'ピクセルフェニックス', price: 3000, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Phoenix' },
    { id: 'av-s-7', name: 'ドットドラゴン', price: 3500, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Dragon' },
    { id: 'av-s-8', name: 'ピクセル天使', price: 2800, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Angel' },
    { id: 'av-s-9', name: 'ドット死神', price: 2200, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Reaper' },
    { id: 'av-s-11', name: 'ピクセルヴァンパイア', price: 1800, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Vampire' },
    { id: 'av-s-12', name: 'ドット人魚', price: 2400, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Mermaid' },
    { id: 'av-s-13', name: 'ピクセル妖精', price: 1500, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Fairy' },
    { id: 'av-s-14', name: 'ドットゴーレム', price: 3200, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Golem' },
    { id: 'av-s-15', name: 'ピクセルクラーケン', price: 4000, type: 'avatar', preview: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Kraken' },
  ];

  // ガチャ景品リスト（重み付け用）
  const gachaPool: GachaItem[] = [
    // Normal (70% total)
    { id: 'acc-ribbon', name: '赤いリボン', price: 0, type: 'accessory', rarity: 'N', preview: '🎀' },
    { id: 'acc-balloon', name: 'お祝い風船', price: 0, type: 'accessory', rarity: 'N', preview: '🎈' },
    { id: 'acc-medal-3', name: '3級メダル', price: 0, type: 'accessory', rarity: 'N', preview: '🥉' },
    { id: 'bg-grid', name: 'グリッド背景', price: 0, type: 'theme', rarity: 'N', preview: '🏁' },
    { id: 'acc-glasses', name: 'インテリ眼鏡', price: 0, type: 'accessory', rarity: 'N', preview: '👓' },
    // Rare (20% total)
    { id: 'acc-crown', name: '黄金の王冠', price: 0, type: 'accessory', rarity: 'R', preview: '👑' },
    { id: 'acc-wing', name: '天使の羽', price: 0, type: 'accessory', rarity: 'R', preview: '🪶' },
    { id: 'acc-magic', name: '真実の杖', price: 0, type: 'accessory', rarity: 'R', preview: '🪄' },
    { id: 'bg-aurora', name: 'オーロラ', price: 0, type: 'theme', rarity: 'R', preview: '🌌' },
    { id: 'acc-shield', name: '英知の盾', price: 0, type: 'accessory', rarity: 'R', preview: '🛡️' },
    // Super Rare (8% total)
    { id: 'acc-pet-dog', name: '相棒の柴犬', price: 0, type: 'accessory', rarity: 'SR', preview: '🐕' },
    { id: 'acc-aura', name: '覇者のオーラ', price: 0, type: 'accessory', rarity: 'SR', preview: '✨' },
    { id: 'bg-space', name: '銀河の果て', price: 0, type: 'theme', rarity: 'SR', preview: '🛰️' },
    { id: 'acc-bolt', name: '稲妻の加護', price: 0, type: 'accessory', rarity: 'SR', preview: '⚡' },
    // Secret (2% total)
    { id: 'sec-dragon', name: '伝説のドット龍', price: 0, type: 'accessory', rarity: 'SEC', preview: '🐉' },
    { id: 'sec-brain', name: '黄金のAI頭脳', price: 0, type: 'accessory', rarity: 'SEC', preview: '🧠' },
    { id: 'sec-sword', name: '聖剣マスター', price: 0, type: 'accessory', rarity: 'SEC', preview: '🗡️' },
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
    { name: 'ピクセル冒険者', items: shopItems.filter(i => i.id.startsWith('av-p')) },
    { name: 'ピクセルアニマル', items: shopItems.filter(i => i.id.startsWith('av-a')) },
    { name: '幻獣・スペシャル', items: shopItems.filter(i => i.id.startsWith('av-s')) },
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
            <p className="text-xs font-medium text-slate-500">ピクセルコレクションを広げよう</p>
          </div>
        </div>
        <div className="bg-amber-50 px-4 py-2 rounded-2xl border border-amber-100 flex items-center gap-2 shadow-sm">
          <span className="text-amber-600 font-bold">{stats.coins}</span>
          <span className="text-lg">🪙</span>
        </div>
      </header>

      {/* ガチャエリア */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="space-y-1">
             <div className="flex items-center justify-center gap-2 mb-2">
               <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Master Collection</span>
             </div>
             <h3 className="text-2xl font-bold tracking-tight">ドット・マスターガチャ</h3>
             <button 
               onClick={() => setShowRates(!showRates)}
               className="text-[10px] text-indigo-400 font-bold hover:text-indigo-300 transition underline underline-offset-4"
             >
               提供割合を確認する
             </button>
          </div>

          {showRates && (
            <div className="w-full max-w-xs bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-left animate-in slide-in-from-top-2">
               <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">ガチャ提供割合</h4>
               <div className="space-y-2">
                 <div className="flex justify-between text-[11px] font-bold">
                   <span className="text-amber-400">SECRET</span>
                   <span>2%</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-bold">
                   <span className="text-purple-400">SUPER RARE</span>
                   <span>8%</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-bold">
                   <span className="text-blue-400">RARE</span>
                   <span>20%</span>
                 </div>
                 <div className="flex justify-between text-[11px] font-bold">
                   <span className="text-slate-400">NORMAL</span>
                   <span>70%</span>
                 </div>
               </div>
            </div>
          )}
          
          <div className={`w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/10 text-6xl shadow-inner relative group transition-all duration-500 ${gachaResult?.rarity === 'SEC' ? 'ring-4 ring-amber-400/50 scale-110' : ''}`}>
            {isGachaRolling ? (
              <div className="animate-bounce">🎁</div>
            ) : gachaResult ? (
              <div className="animate-in zoom-in duration-500 flex flex-col items-center">
                <span>{gachaResult.preview}</span>
                <span className={`text-[8px] font-black mt-2 tracking-tighter ${getRarityColor(gachaResult.rarity)}`}>
                  {gachaResult.rarity === 'SEC' ? 'SECRET!!' : gachaResult.rarity}
                </span>
              </div>
            ) : (
              <div className="opacity-20 group-hover:opacity-40 transition">👾</div>
            )}
            {isGachaRolling && (
              <div className="absolute inset-0 rounded-[2.5rem] border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            )}
          </div>

          <div className="space-y-3 w-full max-w-xs">
            <button 
              disabled={stats.coins < 300 || isGachaRolling}
              onClick={handleRollGacha}
              className={`w-full py-4 rounded-2xl font-bold text-base transition-all bounce-on-click flex items-center justify-center gap-3 ${
                stats.coins >= 300 && !isGachaRolling 
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-900/40' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              300 🪙 でガチャを回す
            </button>
            <p className="text-[9px] text-slate-500 font-medium">ガチャを回すとアイテムがランダムで手に入ります</p>
          </div>
        </div>
      </section>

      {/* ショップラインナップ - カテゴリ分け */}
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
                        isOwned 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : canAfford 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-slate-50 text-slate-300'
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
