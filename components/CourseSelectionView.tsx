
import React from 'react';
import { EikenLevel } from '../types';

interface CourseSelectionViewProps {
  onSelect: (level: EikenLevel) => void;
}

const CourseSelectionView: React.FC<CourseSelectionViewProps> = ({ onSelect }) => {
  const courses = [
    { level: EikenLevel.GRADE_3, title: '英検 3級', desc: '中学卒業レベルの基礎固め', color: 'from-emerald-400 to-emerald-600' },
    { level: EikenLevel.GRADE_PRE_2, title: '英検 準2級', desc: '高校中級程度の応用力アップ', color: 'from-sky-400 to-sky-600' },
    { level: EikenLevel.GRADE_2, title: '英検 2級', desc: '高校卒業レベル・実務英語', color: 'from-indigo-400 to-indigo-600' },
    { level: EikenLevel.GRADE_PRE_1, title: '英検 準1級', desc: '大学中級程度・高い発信力', color: 'from-amber-400 to-amber-600' },
    { level: EikenLevel.GRADE_1, title: '英検 1級', desc: '大学上級・ネイティブレベル', color: 'from-rose-400 to-rose-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <header className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-white shadow-xl border border-slate-100 mb-4 transform -rotate-6">
            <span className="text-4xl">📚</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter">学習コースを選択</h1>
          <p className="text-slate-400 font-bold text-lg md:text-xl">どのレベルの英単語からマスターしますか？</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => (
            <button
              key={c.level}
              onClick={() => onSelect(c.level)}
              className={`group p-1 rounded-[2.5rem] bg-gradient-to-br ${c.color} shadow-xl hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 relative overflow-hidden h-full`}
            >
              <div className="bg-white rounded-[2.2rem] p-8 h-full flex flex-col justify-between items-start text-left relative z-10">
                <div>
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2 opacity-60">TARGET</span>
                   <h3 className="text-3xl font-black text-slate-800 tracking-tight mb-3">{c.title}</h3>
                   <p className="text-slate-500 font-bold text-sm leading-relaxed">{c.desc}</p>
                </div>
                <div className="mt-8 w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition">
                   <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center pt-6 opacity-40 hover:opacity-100 transition">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Course can be changed later anytime</p>
        </div>
      </div>
    </div>
  );
};

export default CourseSelectionView;
