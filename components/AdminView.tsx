
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

  // 解析ロジック: 8カラムに対応
  // 単語, 意味, 発音記号, 成り立ち, 例文, 例文訳, 同じ語源(word:mean,word:mean), 類義語(w1,w2)
  const parsedWords = useMemo(() => {
    if (!pasteData.trim()) return [];
    const lines = pasteData.split(/\r?\n/).filter(line => line.trim());
    return lines.map((line, idx) => {
      // タブ区切りを優先（Excel/スプレッドシートからのコピペ用）
      const parts = line.split('\t');
      
      const relatedWordsRaw = parts[6] || '';
      const relatedWords = relatedWordsRaw.split(',').filter(s => s.trim()).map(s => {
        const [t, m] = s.split(':');
        return { term: t?.trim() || '', meaning: m?.trim() || '' };
      }).filter(item => item.term);

      const synonymsRaw = parts[7] || '';
      const synonyms = synonymsRaw.split(',').filter(s => s.trim()).map(s => s.trim());

      return {
        id: `admin-${Date.now()}-${idx}`,
        term: parts[0]?.trim() || '',
        meaning: parts[1]?.trim() || '',
        phonetic: parts[2]?.trim() || '',
        etymology: parts[3]?.trim() || '',
        exampleSentence: parts[4]?.trim() || '',
        exampleSentenceJapanese: parts[5]?.trim() || '',
        relatedWords: relatedWords.length > 0 ? relatedWords : undefined,
        synonyms: synonyms.length > 0 ? synonyms : undefined,
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
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">一括データ登録</h2>
          <p className="text-slate-400 font-bold text-sm">Excelの8列をそのまま貼り付けてFirebaseへ同期</p>
        </div>
        <button onClick={onCancel} className="text-slate-400 font-bold text-sm uppercase hover:text-rose-500 transition">キャンセル</button>
      </header>

      <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-100 space-y-8 relative overflow-hidden">
        {isSaving && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 animate-in fade-in">
            <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
            <p className="font-black text-slate-800 text-xl">Firebaseに全データを同期中...</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white font-bold text-xs">1</div>
            <h3 className="text-lg font-black text-slate-800">登録する英検級を選択</h3>
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
            <h3 className="text-lg font-black text-slate-800">スプレッドシートからコピペ</h3>
            <span className="text-[10px] font-black text-indigo-400 bg-indigo-50 px-2 py-1 rounded">8カラム: 単語 / 意味 / 発音 / 成り立ち / 例文 / 訳 / 同じ語源 / 類義語</span>
          </div>
          <div className="text-[9px] text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2 leading-relaxed">
            ※ <b>同じ語源</b>は「word:意味,word:意味」形式。<b>類義語</b>は「syn1,syn2」形式で入力してください。
          </div>
          <textarea
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            placeholder="apple	りんご	/ˈæp.əl/	中心に芯がある果物	I like apples.	りんごが好きです。	pineapple:パイナップル	fruit,red"
            className="w-full h-64 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-mono text-sm focus:ring-8 focus:ring-indigo-500/5 outline-none transition shadow-inner"
          />
        </div>

        {parsedWords.length > 0 && (
          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 animate-in slide-in-from-top-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">インポートプレビュー ({parsedWords.length}件)</h4>
            <div className="overflow-x-auto custom-scrollbar rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 font-black">
                    <th className="p-3 border-b">単語</th>
                    <th className="p-3 border-b">意味</th>
                    <th className="p-3 border-b">同じ語源</th>
                    <th className="p-3 border-b">類義語</th>
                  </tr>
                </thead>
                <tbody className="font-bold text-slate-600">
                  {parsedWords.slice(0, 5).map((w, i) => (
                    <tr key={i} className="hover:bg-indigo-50/30 transition border-b border-slate-50">
                      <td className="p-3 text-indigo-600">{w.term}</td>
                      <td className="p-3">{w.meaning}</td>
                      <td className="p-3 text-slate-400">{w.relatedWords?.map(r => r.term).join(', ') || '-'}</td>
                      <td className="p-3 truncate max-w-[100px]">{w.synonyms?.join(', ') || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedWords.length > 5 && <div className="p-3 text-center text-slate-300 font-black text-[10px]">...他 {parsedWords.length - 5} 件</div>}
            </div>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={parsedWords.length === 0 || isSaving}
          className={`w-full py-6 rounded-[2.5rem] font-black text-xl transition-all shadow-2xl bounce-on-click flex items-center justify-center gap-3 ${
            parsedWords.length > 0 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
              : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          {parsedWords.length > 0 ? `Firebaseに一括保存して同期` : 'データを入力してください'}
        </button>

        {isSuccess && (
          <div className="p-5 bg-emerald-50 border-2 border-emerald-100 rounded-[2rem] flex items-center gap-4 text-emerald-600 animate-in zoom-in-95 shadow-lg shadow-emerald-50">
            <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center font-black">✓</div>
            <span className="font-black text-lg">クラウド同期に成功しました！</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
