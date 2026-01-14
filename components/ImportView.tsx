
import React, { useState } from 'react';
import { Word, EikenLevel } from '../types';

interface ImportViewProps {
  onImport: (words: Word[]) => void;
  onCancel: () => void;
}

const ImportView: React.FC<ImportViewProps> = ({ onImport, onCancel }) => {
  const [csvText, setCsvText] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<EikenLevel>(EikenLevel.GRADE_3);

  const handleImport = () => {
    const lines = csvText.split('\n').filter(l => l.trim());
    const newWords: Word[] = lines.map((line, idx) => {
      const parts = line.split(',');
      const term = parts[0]?.trim() || '';
      const meaning = parts[1]?.trim() || '';
      return {
        id: `import-${Date.now()}-${idx}`,
        term,
        meaning,
        level: selectedLevel,
      };
    }).filter(w => w.term && w.meaning);

    if (newWords.length > 0) {
      onImport(newWords);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">単語リストのインポート</h2>
      <p className="text-slate-500">
        CSV形式で単語をインポートできます（例: apple, りんご）。
        1行に1単語、単語と意味をカンマで区切ってください。
      </p>

      <div className="space-y-2">
        <label className="text-sm font-bold text-slate-700">デフォルトレベル</label>
        <select 
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value as EikenLevel)}
          className="w-full p-3 border rounded-xl"
        >
          {Object.values(EikenLevel).map(l => (
            <option key={l} value={l}>英検 {l}</option>
          ))}
        </select>
      </div>

      <textarea 
        value={csvText}
        onChange={(e) => setCsvText(e.target.value)}
        placeholder="apple, りんご&#10;banana, バナナ"
        className="w-full h-64 p-4 border rounded-2xl font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
      />

      <div className="flex gap-4">
        <button 
          onClick={onCancel}
          className="flex-1 py-4 border-2 border-slate-100 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition"
        >
          キャンセル
        </button>
        <button 
          onClick={handleImport}
          className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-lg"
        >
          インポート実行
        </button>
      </div>
    </div>
  );
};

export default ImportView;
