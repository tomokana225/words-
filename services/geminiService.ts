
import { GenerateContentResponse, Type, Modality } from "@google/genai";
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

// Audio Decoding Helper
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

function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const playPronunciation = async (text: string) => {
  try {
    const response = await callGeminiProxy({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this English phrase naturally: ${text}` }] }],
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
    const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtx, 24000, 1);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch (error) {
    console.error("TTS Error via Proxy:", error);
  }
};

export const getWordDetails = async (term: string): Promise<Partial<Word>> => {
  try {
    const response = await callGeminiProxy({
      model: "gemini-3-pro-preview",
      contents: `Analyze the English word "${term}". Provide professional linguistic details in Japanese. 
      Include: phonetic symbols, etymology (prefix/root/suffix breakdown), core image concept description, 3 synonyms, and a natural example sentence with its Japanese translation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            phonetic: { type: Type.STRING },
            etymology: { type: Type.STRING, description: "Detailed breakdown of prefix, suffix, and core image concept in Japanese." },
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
    console.error("getWordDetails Proxy Error:", error);
    return {};
  }
};

export const generateCoreImage = async (term: string, meaning: string): Promise<string | null> => {
  try {
    const response = await callGeminiProxy({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A clean, vivid 3D educational minimalist illustration for the English word "${term}" (meaning: ${meaning}). High quality icon style, bright professional colors, white background. Visualizes the core abstract concept without any text.` }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (error) {
    console.error("generateCoreImage Proxy Error:", error);
    return null;
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
