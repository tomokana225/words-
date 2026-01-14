
import React, { useState, useEffect } from 'react';
import { Word } from '../types';
import { getWordDetails, generateCoreImage, playPronunciation } from '../services/geminiService';
import { fetchWordFromDB, saveWordToDB } from '../services/firebaseService';

interface WordDetailViewProps {
  word: Word;
  onUpdate: (word: Word) => void;
  onBack: () => void;
  onSelectSynonym: (term: string) => void;
}

const WordDetailView: React.FC<WordDetailViewProps> = ({ word, onUpdate, onBack, onSelectSynonym }) => {
  const [details, setDetails] = useState<Partial<Word>>(word.phonetic ? word : {});
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(word.imageUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      if (word.phonetic && word.imageUrl && word.meaning !== '解析中...') {
        setDetails(word);
        setImageUrl(word.imageUrl);
        return;
      }
      setLoading(true);
      setImageLoading(true);
      const cached = await fetchWordFromDB(word.term);
      let finalDetails = { ...word, ...cached };
      if (!finalDetails.phonetic || !finalDetails.etymology) {
        const aiDetails = await getWordDetails(word.term);
        finalDetails = { ...finalDetails, ...aiDetails };
      }
      setDetails(finalDetails);
      setLoading(false);
      if (!finalDetails.imageUrl) {
        const aiImage = await generateCoreImage(word.term, word.meaning);
        finalDetails.imageUrl = aiImage || undefined;
        setImageUrl(aiImage);
      }
      setImageLoading(false);
      if (!cached) await saveWordToDB(finalDetails as Word);
      onUpdate(finalDetails as Word);
    };
    fetchAll();
  }, [word.id, word.term]);

  const handlePlay = async (text?: string) => {
    if (!text || isPlaying) return;
    setIsPlaying(true);
    await playPronunciation(text);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const formatDate = (ts?: number) => {
    if (!ts) return '未設定';
    return new Date(ts).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500 pb-24">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-100 bounce-on-click hover:bg-slate-50 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-600"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div className="flex flex-col items-center">
           <span className="font-black text-slate-400 uppercase tracking-[0.3em] text-[10px] md:text-xs">AI Deep Analysis</span>
           {word.nextReviewDate && (
             <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest mt-1 bg-rose-50 px-3 py-1 rounded-full">Next Review: {formatDate(word.nextReviewDate)}</span>
           )}
        </div>
        <button 
          onClick={() => handlePlay(word.term)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white text-indigo-600 shadow-lg border border-slate-100 hover:scale-105'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        </button>
      </header>

      <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-2xl border border-slate-50 flex flex-col md:flex-row">
        {/* Responsive Image Section */}
        <div className="w-full md:w-1/2 aspect-square md:aspect-auto relative bg-slate-50">
          {imageLoading ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-6">
              <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
              <p className="text-xs font-black text-indigo-400 uppercase tracking-widest animate-pulse">Core Concept Image...</p>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt={word.term} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-8xl grayscale opacity-20">🎨</div>
          )}
          <div className="absolute bottom-10 left-10 right-10">
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-2xl border border-white/50 inline-block transform -rotate-1 hover:rotate-0 transition duration-500">
               <span className="text-[10px] md:text-xs font-black text-indigo-600 uppercase mb-2 block tracking-[0.2em]">Eiken Level {word.level}</span>
               <h1 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter">{word.term}</h1>
               <div className="flex items-center gap-2 mt-3 text-slate-400 font-mono font-bold tracking-widest">{details.phonetic}</div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-10 md:p-14 space-y-12 overflow-y-auto max-h-[800px] custom-scrollbar bg-white">
          <div className="flex flex-col gap-2">
            <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">{details.meaning || word.meaning}</h2>
          </div>

          <div className="space-y-10">
            <div className="bg-slate-50/80 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
              <h3 className="text-[10px] md:text-xs font-black text-indigo-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                成り立ち・コアイメージ
              </h3>
              <p className="text-slate-700 leading-relaxed font-bold md:text-lg whitespace-pre-wrap">{details.etymology}</p>
            </div>

            <div className="p-8 border-l-8 border-indigo-600 bg-indigo-50/30 rounded-r-[2.5rem] relative group hover:bg-indigo-50/50 transition shadow-sm border border-slate-100">
              <h3 className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">実践例文</h3>
              <p className="text-xl md:text-2xl text-slate-800 font-black mb-4 leading-snug tracking-tight">{details.exampleSentence}</p>
              <p className="text-base md:text-lg text-slate-500 font-bold leading-relaxed">{details.exampleSentenceJapanese}</p>
              <button 
                onClick={() => handlePlay(details.exampleSentence)}
                className="absolute top-6 right-6 w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-indigo-500 hover:scale-110 active:scale-90 transition border border-slate-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              </button>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest px-3">類義語・関連ワード</h3>
               <div className="flex flex-wrap gap-3">
                 {details.synonyms?.map((s, i) => (
                   <button 
                     key={i} 
                     onClick={() => onSelectSynonym(s)}
                     className="px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm md:text-base font-black text-indigo-600 hover:border-indigo-500 hover:shadow-xl hover:translate-y-[-2px] transition-all bounce-on-click"
                   >
                     {s}
                   </button>
                 ))}
                 {!details.synonyms?.length && <p className="text-slate-300 font-bold px-3 italic">関連ワードを解析中...</p>}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordDetailView;
