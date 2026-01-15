
import { GenerateContentResponse, Type } from "@google/genai";
import { Word } from "../types";

// サーバーサイド・プロキシ経由でGeminiを呼び出す汎用関数
const callGeminiProxy = async (payload: any) => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "generateContent",
      ...payload
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Proxy request failed");
  }
  return await response.json() as GenerateContentResponse;
};

// ブラウザ標準のWeb Speech APIを使用した高速な音声読み上げ
export const playPronunciation = (text: string) => {
  if (!window.speechSynthesis) return;
  // すでに再生中の音声を停止
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9; // 少しゆっくりめで聞き取りやすく
  window.speechSynthesis.speak(utterance);
};

export const getWordDetails = async (term: string): Promise<Partial<Word>> => {
  try {
    const response = await callGeminiProxy({
      model: "gemini-3-pro-preview",
      contents: `Analyze the English word "${term}". Provide professional linguistic details in Japanese. 
      Include: phonetic symbols, etymology (prefix/root/suffix breakdown), core image concept description, 3 synonyms, a natural example sentence with its Japanese translation, and 3 other words that share the same root or etymology with their meanings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            phonetic: { type: Type.STRING },
            etymology: { type: Type.STRING, description: "Detailed breakdown of prefix, suffix, and core image concept in Japanese." },
            relatedWords: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  meaning: { type: Type.STRING }
                },
                required: ["term", "meaning"]
              },
              description: "3 words sharing the same root."
            },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
            exampleSentence: { type: Type.STRING },
            exampleSentenceJapanese: { type: Type.STRING }
          },
          required: ["phonetic", "etymology", "synonyms", "exampleSentence", "exampleSentenceJapanese", "relatedWords"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("getWordDetails Proxy Error:", error);
    return {};
  }
};

export const getDiagnosticQuiz = async (level: string): Promise<any[]> => {
  try {
    const response = await callGeminiProxy({
      model: "gemini-3-flash-preview",
      contents: `Generate 10 essential vocabulary quiz questions for Eiken ${level}. Each question should be a 4-choice quiz with one correct index (0-3). Output in JSON format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              meaning: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctIndex: { type: Type.INTEGER }
            },
            required: ["term", "meaning", "options", "correctIndex"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("getDiagnosticQuiz Proxy Error:", error);
    return [];
  }
};
