
import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { getWordDetails, playPronunciation } from '../services/geminiService';
import { fetchWordFromDB, saveWordToDB } from '../services/firebaseService';

interface WordDetailViewProps {
  word: Word;
  allWords: Word[]; 
  onUpdate: (word: Word) => void;
  onBack: () => void;
  onSelectSynonym: (term: string) => void;
}

const WordDetailView: React.FC<WordDetailViewProps> = ({ word, allWords, onUpdate, onBack, onSelectSynonym }) => {
  const [details, setDetails] = useState<Partial<Word>>(word.phonetic ? word : {});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      if (word.phonetic && word.etymology && word.meaning !== '解析中...') {
        setDetails(word);
        return;
      }
      setLoading(true);
      const cached = await fetchWordFromDB(word.term);
      let finalDetails = { ...word, ...cached };
      
      if (!finalDetails.phonetic || !finalDetails.etymology || !finalDetails.relatedWords) {
        const aiDetails = await getWordDetails(word.term);
        finalDetails = { ...finalDetails, ...aiDetails };
      }
      
      setDetails(finalDetails);
      setLoading(false);
      
      if (!cached) await saveWordToDB(finalDetails as Word);
      onUpdate(finalDetails as Word);
    };
    fetchAll();
  }, [word.id, word.term]);

  const handlePlay = (text?: string) => {
    if (!text) return;
    playPronunciation(text);
  };

  const isWordKnown = (term: string) => {
    return allWords.some(w => w.term.toLowerCase() === term.toLowerCase());
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden animate-view">
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition bounce-on-click">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span className="font-black text-slate-300 uppercase tracking-[0.3em] text-[10px]">Word Analysis</span>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 space-y-6">
        <div className="max-w-2xl mx-auto space-y-6 pb-20">
          
          {/* Word Hero Section */}
          <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
            <div className="relative z-10 space-y-6">
              
              <div className="flex flex-wrap gap-2 items-center">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">
                  {word.level}
                </span>
                <div className="flex gap-1 items-center bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-1">Mastery</span>
                  {[1,2,3,4].map(s => (
                    <div key={s} className={`w-2 h-2 rounded-full ${s <= (word.masteryCount || 0) ? 'bg-indigo-500 shadow-[0_0_5px_rgba(79,70,229,0.4)]' : 'bg-slate-200'}`}></div>
                  ))}
                </div>
              </div>

              {/* レイアウト改善: 単語、発音記号、ボタンを重ならないように配置 */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-4 flex-1 min-w-0">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tighter leading-tight break-all">
                    {word.term}
                  </h1>
                  <div className="flex items-center gap-4 bg-slate-50 p-2 pl-3 pr-2 rounded-2xl border border-slate-100 inline-flex">
                    <p className="text-sm font-bold text-slate-500 font-mono italic">
                      {details.phonetic || '...'}
                    </p>
                    <button 
                      onClick={() => handlePlay(word.term)}
                      className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition shadow-lg flex-shrink-0"
                      aria-label="読み上げ"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    </button>
                  </div>
                </div>
                <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100/50 flex-shrink-0 md:max-w-[200px]">
                  <h2 className="text-2xl font-black text-indigo-700 tracking-tight leading-tight">
                    {details.meaning || word.meaning}
                  </h2>
                </div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-xs font-black uppercase tracking-widest">AI Engine Analyzing...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14"/></svg>
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">成り立ち・コアイメージ</h3>
                </div>
                <p className="text-sm font-bold text-slate-600 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-50/50">
                  {details.etymology}
                </p>
              </section>

              <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">例文</h3>
                </div>
                <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-4 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-100/30 rounded-full -mr-12 -mt-12 blur-2xl"></div>
                  <div className="pr-12 space-y-3">
                    <p className="text-lg font-black text-slate-800 leading-snug relative z-10">{details.exampleSentence}</p>
                    <p className="text-xs font-bold text-slate-500 relative z-10">{details.exampleSentenceJapanese}</p>
                  </div>
                  <button 
                    onClick={() => handlePlay(details.exampleSentence)} 
                    className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition z-20"
                    aria-label="例文読み上げ"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                  同じ語源の仲間
                </h3>
                <div className="space-y-2">
                  {details.relatedWords?.map((rw, i) => {
                    const known = isWordKnown(rw.term);
                    return (
                      <div key={i} onClick={() => known && onSelectSynonym(rw.term)} className={`flex items-center justify-between p-3 rounded-xl border border-slate-100 transition group ${known ? 'hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer' : 'opacity-60 grayscale cursor-default'}`}>
                        <div className="flex flex-col">
                          <span className={`text-sm font-black ${known ? 'text-slate-700 group-hover:text-indigo-600' : 'text-slate-400'}`}>
                            {rw.term} {!known && <span className="text-[8px] opacity-40 ml-1">(未登録)</span>}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">{rw.meaning}</span>
                        </div>
                        {known && (
                          <div className="text-slate-200 group-hover:text-indigo-300 transition">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6"></polyline></svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  類義語
                </h3>
                <div className="flex flex-wrap gap-2">
                  {details.synonyms?.map((s, i) => {
                    const known = isWordKnown(s);
                    return (
                      <button key={i} onClick={() => known && onSelectSynonym(s)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${known ? 'bg-slate-50 hover:bg-white border border-slate-100 hover:border-indigo-200 text-slate-600 bounce-on-click' : 'bg-slate-50 border-transparent text-slate-300 cursor-default grayscale'}`}>
                        {s} {!known && <span className="text-[7px] opacity-40 ml-1">×</span>}
                      </button>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordDetailView;
