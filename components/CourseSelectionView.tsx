
import React from 'react';
import { EikenLevel } from '../types';

interface CourseSelectionViewProps {
  onSelect: (level: EikenLevel) => void;
  onLogin?: () => void;
  onBack: () => void;
}

const CourseSelectionView: React.FC<CourseSelectionViewProps> = ({ onSelect, onLogin, onBack }) => {
  const courses = [
    { level: EikenLevel.GRADE_3, title: '英検 3級', count: '基礎レベル', color: 'bg-emerald-500' },
    { level: EikenLevel.GRADE_PRE_2, title: '英検 準2級', count: '初中級レベル', color: 'bg-sky-500' },
    { level: EikenLevel.GRADE_2, title: '英検 2級', count: '中級レベル', color: 'bg-indigo-500' },
    { level: EikenLevel.GRADE_PRE_1, title: '英検 準1級', count: '上級レベル', color: 'bg-amber-500' },
    { level: EikenLevel.GRADE_1, title: '英検 1級', count: '最上級レベル', color: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-900 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">単語帳</h2>
          <p className="text-xs font-medium text-slate-500">学習する級または自分のリストを選択してください。</p>
        </div>
      </header>

      <div className="space-y-3">
        {courses.map((c) => (
          <button
            key={c.level}
            onClick={() => onSelect(c.level)}
            className="w-full bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 hover:bg-slate-50 transition-all bounce-on-click"
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${c.color} flex items-center justify-center text-white shadow-sm`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              </div>
              <div className="text-left">
                <p className="text-base font-bold text-slate-800">{c.title}</p>
                <p className="text-[10px] font-medium text-slate-400">{c.count}</p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-300 group-hover:text-indigo-400 transition-all"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">マイ単語帳</p>
        <button 
          onClick={() => alert('My単語帳作成機能は開発中です')}
          className="w-full py-4 bg-indigo-50 border-2 border-dashed border-indigo-100 rounded-xl text-indigo-600 font-bold text-sm hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          新しい単語帳を作成
        </button>
        
        <button 
          onClick={() => onSelect('ALL' as any)}
          className="w-full py-4 border border-slate-200 rounded-xl text-slate-600 font-bold text-sm hover:bg-white hover:border-indigo-300 transition-all"
        >
          登録済み単語をすべて表示
        </button>
      </div>

      {onLogin && (
        <div className="text-center pt-6">
          <button onClick={onLogin} className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-600 transition">
            アカウントをお持ちの方はこちらからログイン
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseSelectionView;
