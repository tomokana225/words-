
import React, { useState, useMemo } from 'react';
import { Word, EikenLevel } from '../types';

interface AdminViewProps {
  onImport: (words: Word[]) => void;
  onCancel: () => void;
}

const AdminView: React.FC<AdminViewProps> = ({ onImport, onCancel }) => {
  const [pasteData, setPasteData] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel>(EikenLevel.GRADE_3);
  const [isSuccess, setIsSuccess] = useState(false);

  const parsedWords = useMemo(() => {
    if (!pasteData.trim()) return [];
    
    // Split by lines
    const lines = pasteData.split(/\r?\n/).filter(line => line.trim());
    
    return lines.map((line, idx) => {
      // Excel copy-paste usually results in Tab-separated values (\t)
      // We also fallback to comma for standard CSV
      const parts = line.includes('\t') ? line.split('\t') : line.split(',');
      
      const term = parts[0]?.trim() || '';
      const meaning = parts[1]?.trim() || '';
      
      return {
        id: `admin-${Date.now()}-${idx}`,
        term,
        meaning,
        level: selectedLevel,
      } as Word;
    }).filter(w => w.term && w.meaning);
  }, [pasteData, selectedLevel]);

  const handleSave = () => {
    if (parsedWords.length > 0) {
      onImport(parsedWords);
      setIsSuccess(true);
      setPasteData('');
      setTimeout(() => setIsSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
      <header className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-black text-slate-800">管理者メニュー</h2>
        <button onClick={onCancel} className="text-slate-400 font-bold text-sm uppercase">閉じる</button>
      </header>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-800 mb-1">エクセルからペースト</h3>
          <p className="text-slate-400 text-sm font-bold leading-relaxed">
            Excelやスプレッドシートの「単語」と「意味」の2列をコピーして、下のエリアに貼り付けてください。
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">追加するレベル</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(EikenLevel).map(l => (
              <button
                key={l}
                onClick={() => setSelectedLevel(l)}
                className={`py-3 px-2 rounded-xl text-xs font-black border-2 transition ${
                  selectedLevel === l 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-white border-slate-100 text-slate-400'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={pasteData}
          onChange={(e) => setPasteData(e.target.value)}
          placeholder="ここにペースト... (例: apple   りんご)"
          className="w-full h-48 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
        />

        {parsedWords.length > 0 && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">インポート内容プレビュー ({parsedWords.length}件)</h4>
            <div className="max-h-40 overflow-y-auto border border-slate-100 rounded-2xl bg-slate-50 p-2 text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200">
                    <th className="p-2 font-black uppercase">Word</th>
                    <th className="p-2 font-black uppercase">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedWords.map((w, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="p-2 font-bold text-slate-700">{w.term}</td>
                      <td className="p-2 text-slate-500 font-medium">{w.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={parsedWords.length === 0}
          className={`w-full py-5 rounded-[2rem] font-black text-lg transition shadow-xl bounce-on-click ${
            parsedWords.length > 0 
              ? 'bg-indigo-600 text-white shadow-indigo-100' 
              : 'bg-slate-100 text-slate-300 shadow-none'
          }`}
        >
          {parsedWords.length > 0 ? `${parsedWords.length}単語を登録する` : 'データを貼り付けてください'}
        </button>

        {isSuccess && (
          <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-600 animate-in zoom-in-95">
            <span className="text-xl">✅</span>
            <span className="font-black text-sm">単語の登録が完了しました！</span>
          </div>
        )}
      </div>

      <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100">
        <h3 className="text-lg font-black text-amber-600 mb-2 flex items-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
           ヒント
        </h3>
        <p className="text-amber-700/70 text-sm font-bold leading-relaxed">
          収録語はローカルストレージに保存されます。一度に大量の単語を追加すると、ブラウザの動作が重くなる場合があります。
        </p>
      </div>
    </div>
  );
};

export default AdminView;
