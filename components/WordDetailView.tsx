
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
      if (!finalDetails.phonetic || !finalDetails.etymology || !finalDetails.relatedWords) {
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
    <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-view">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div className="flex flex-col items-center">
           <span className="font-bold text-slate-300 uppercase tracking-widest text-[10px]">AI 言語解析</span>
        </div>
        <div className="w-10"></div>
      </header>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        <div className="aspect-[4/3] relative bg-slate-50 border-b border-slate-100">
          {imageLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : imageUrl ? (
            <img src={imageUrl} alt={word.term} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-10">🎨</div>
          )}
          <div className="absolute bottom-6 left-6 right-6">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 inline-block">
               <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{word.term}</h1>
               <p className="text-xs font-medium text-slate-400 font-mono mt-1">{details.phonetic}</p>
            </div>
          </div>
          <button 
            onClick={() => handlePlay(word.term)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-indigo-600 shadow-lg border border-white hover:scale-105 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{details.meaning || word.meaning}</h2>
            <div className="h-0.5 w-12 bg-indigo-500 rounded-full"></div>
          </div>

          <div className="space-y-8">
            <section className="space-y-3">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                成り立ちとコアイメージ
              </h3>
              <p className="text-slate-600 leading-relaxed font-medium text-sm whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-100">{details.etymology}</p>
            </section>

            {/* 同じ語源を持つ単語セクション */}
            {details.relatedWords && details.relatedWords.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="3"/><path d="M12 16.5A4.5 4.5 0 1 0 7.5 12"/><path d="M12 7.5A4.5 4.5 0 1 1 16.5 12"/></svg>
                  同じ語源を持つ仲間
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {details.relatedWords.map((rw, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 hover:bg-indigo-50 transition cursor-pointer group" onClick={() => onSelectSynonym(rw.term)}>
                      <span className="text-sm font-bold text-indigo-700 group-hover:scale-105 transition-transform">{rw.term}</span>
                      <span className="text-xs text-slate-500 font-medium">{rw.meaning}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-3 relative">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">例文</h3>
              <div className="p-5 border-l-4 border-indigo-500 bg-indigo-50/30 rounded-r-xl">
                <p className="text-base text-slate-800 font-bold mb-2 leading-snug">{details.exampleSentence}</p>
                <p className="text-xs text-slate-500 font-medium">{details.exampleSentenceJapanese}</p>
                <button 
                  onClick={() => handlePlay(details.exampleSentence)}
                  className="mt-4 flex items-center gap-1.5 text-indigo-600 text-[10px] font-bold hover:underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
                  音声で再生
                </button>
              </div>
            </section>

            <section className="space-y-3">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">類義語</h3>
               <div className="flex flex-wrap gap-2">
                 {details.synonyms?.map((s, i) => (
                   <button 
                     key={i} 
                     onClick={() => onSelectSynonym(s)}
                     className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition bounce-on-click"
                   >
                     {s}
                   </button>
                 ))}
               </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WordDetailView;
