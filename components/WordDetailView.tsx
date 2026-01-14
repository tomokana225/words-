
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500 pb-20">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 bounce-on-click">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <span className="font-black text-slate-400 uppercase tracking-widest text-[10px]">単語詳細分析</span>
        <button 
          onClick={() => handlePlay(word.term)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-indigo-500 text-white' : 'bg-white text-indigo-500 shadow-sm border border-slate-100'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
        </button>
      </header>

      <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-slate-100">
        <div className="aspect-square w-full relative bg-slate-50">
          {imageLoading ? (
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Generating Visuals...</p>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt={word.term} className="w-full h-full object-cover" />
          ) : null}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/80 backdrop-blur-lg p-5 rounded-2xl shadow-xl inline-block">
               <span className="text-[10px] font-black text-indigo-600 uppercase mb-1 block">Level {word.level}</span>
               <h1 className="text-4xl font-black text-slate-800">{word.term}</h1>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex flex-col gap-1">
            <p className="text-2xl font-black text-slate-800">{details.meaning || word.meaning}</p>
            <p className="font-mono text-indigo-500 font-bold">{details.phonetic}</p>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-3xl">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">語源・成り立ち</h3>
              <p className="text-slate-700 leading-relaxed font-bold">{details.etymology}</p>
            </div>

            <div className="p-6 border-l-4 border-indigo-500 bg-indigo-50/30 rounded-r-3xl relative group">
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">例文</h3>
              <p className="text-lg text-slate-800 font-bold mb-2">{details.exampleSentence}</p>
              <p className="text-sm text-slate-500 font-medium">{details.exampleSentenceJapanese}</p>
              <button 
                onClick={() => handlePlay(details.exampleSentence)}
                className="absolute top-4 right-4 text-indigo-300 group-hover:text-indigo-500 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              </button>
            </div>

            <div className="space-y-3">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">類義語</h3>
               <div className="flex flex-wrap gap-2">
                 {details.synonyms?.map((s, i) => (
                   <button 
                     key={i} 
                     onClick={() => onSelectSynonym(s)}
                     className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-indigo-600 hover:border-indigo-500 transition"
                   >
                     {s}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordDetailView;
