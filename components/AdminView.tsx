
import React, { useState, useMemo } from 'react';
import { Word, EikenLevel } from '../types';

interface AdminViewProps {
  onImport: (words: Word[]) => Promise<void>;
  onCancel: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onImport, onCancel }) => {
  const [pasteData, setPasteData] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel>(EikenLevel.GRADE_3);
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const parsedWords = useMemo(() => {
    if (!pasteData.trim()) return [];
    const lines = pasteData.split(/\r?\n/).filter(line => line.trim());
    return lines.map((line, idx) => {
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      const term = parts[0]?.trim() || '';
      const meaning = parts[1]?.trim() || '';
      return {
        id: `admin-${Date.now()}-${idx}`,
        term,
        meaning,
        level: selectedLevel,
        isMastered: false,
        streak: 0,
        difficultyScore: 0,
        nextReviewDate: Date.now()
      } as Word;
    }).filter(w => w.term && w.meaning);
  }, [pasteData, selectedLevel]);

  const handleSave = async () => {
    if (parsedWords.length > 0) {
      setIsSaving(true);
      await onImport(parsedWords);
      setIsSaving(false);
      setIsSuccess(true);
      setPasteData('');
      setTimeout(() => setIsSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
      <header className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">管理者メニュー</h2>
          <p className="text-slate-400 font-bold text-sm">クラウドデータベースへ直接書き込みます</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 font-bold text-sm uppercase hover:text-rose-500 transition">キャンセル</button>
      </header>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100 space-y-8 relative overflow-hidden">
        {isSaving && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 animate-in fade-in">
            <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
            <p className="font-black text-slate-800 text-xl">Firebaseに同期中...</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">1</div>
            <h3 className="text-lg font-black text-slate-800">レベルを選択</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.values(EikenLevel).map(l => (
              <button
                key={l}
                onClick={() => setSelectedLevel(l)}
                className={`py-4 px-2 rounded-2xl text-sm font-black border-2 transition-all ${
                  selectedLevel === l 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">2</div>
            <h3 className="text-lg font-black text-slate-800">Excel等からデータをペースト</h3>
          </div>
          <textarea
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            placeholder="apple	りんご&#10;banana	バナナ"
            className="w-full h-64 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-mono text-sm focus:ring-8 focus:ring-indigo-500/5 outline-none transition shadow-inner"
          />
        </div>

        {parsedWords.length > 0 && (
          <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4 px-2">
               <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest">書き込みプレビュー ({parsedWords.length}件)</h4>
            </div>
            <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-2">
              {parsedWords.slice(0, 10).map((w, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-indigo-50">
                  <span className="font-black text-slate-700">{w.term}</span>
                  <span className="text-sm text-slate-400 font-bold">{w.meaning}</span>
                </div>
              ))}
              {parsedWords.length > 10 && <p className="text-center text-[10px] text-slate-300 font-bold pt-2">他 {parsedWords.length - 10} 件...</p>}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={parsedWords.length === 0 || isSaving}
          className={`w-full py-6 rounded-[2.5rem] font-black text-xl transition-all shadow-2xl bounce-on-click flex items-center justify-center gap-3 ${
            parsedWords.length > 0 
              ? 'bg-slate-900 text-white hover:bg-black shadow-slate-200' 
              : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          {parsedWords.length > 0 ? `Firebaseに ${parsedWords.length} 単語を保存` : 'データ入力待ち'}
        </button>

        {isSuccess && (
          <div className="p-5 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] flex items-center gap-4 text-emerald-600 animate-in zoom-in-95 shadow-lg shadow-emerald-50">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-black">✓</div>
            <span className="font-black text-lg">クラウド同期が完了しました！</span>
          </div>
        )}
      </div>

      <div className="bg-amber-50 rounded-[2.5rem] p-8 border border-amber-100 shadow-sm">
        <h3 className="text-lg font-black text-amber-600 mb-3 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
           Firebase保存の注意点
        </h3>
        <ul className="text-amber-700/70 text-sm font-bold leading-relaxed space-y-2 list-disc pl-5">
          <li>保存された単語はログイン中のアカウントに紐付き、他のデバイスからもアクセス可能です。</li>
          <li>解析済みの単語データはグローバルキャッシュとして保存され、AIの応答速度を向上させます。</li>
          <li>一度に500件以上の登録は推奨されません。分割して登録してください。</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminView;
