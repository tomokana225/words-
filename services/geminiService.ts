import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Word } from "../types";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Helper Functions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playPronunciation = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return;

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch (error) {
    console.error("TTS Error:", error);
  }
};

export const getWordDetails = async (term: string): Promise<Partial<Word>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `英単語「${term}」の詳細情報をJSONで提供してください。
      - phonetic: 発音記号
      - etymology: 語源、接頭辞・接尾辞の解説を含む成り立ち（日本語で詳しく）
      - synonyms: 類義語の配列
      - exampleSentence: 英語の例文
      - exampleSentenceJapanese: 例文の和訳`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            phonetic: { type: Type.STRING },
            etymology: { type: Type.STRING },
            synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
            exampleSentence: { type: Type.STRING },
            exampleSentenceJapanese: { type: Type.STRING }
          },
          required: ["phonetic", "etymology", "synonyms", "exampleSentence", "exampleSentenceJapanese"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("getWordDetails Error:", error);
    return {};
  }
};

export const generateCoreImage = async (term: string, meaning: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A simple, clean, educational illustration representing the core concept of the word "${term}" (${meaning}). Style: minimalistic icon, 3D render feel, vibrant colors, white background, no text.` }]
      }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (error) {
    console.error("generateCoreImage Error:", error);
    return null;
  }
};

export const getDiagnosticQuiz = async (level: string): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `英検${level}レベルの重要単語10個をリストアップし、それぞれの意味をJSON形式で生成してください。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              meaning: { type: Type.STRING }
            },
            required: ["term", "meaning"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("getDiagnosticQuiz Error:", error);
    return [];
  }
};