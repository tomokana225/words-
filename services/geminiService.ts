import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Word } from "../types";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Audio Helper Functions
// Decodes base64 string to Uint8Array. Follows manual implementation from guidelines.
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual decoding logic for raw PCM data returned by the Gemini API.
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
    // Using gemini-2.5-flash-preview-tts for high-quality text-to-speech tasks.
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

    // Extracting raw PCM audio data from the response part.
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
    // Using gemini-3-flash-preview for general text reasoning and extraction.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `英単語「${term}」の情報をJSONで提供してください。語源は日本語で。`,
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
          }
        }
      }
    });
    // Access the text property directly on the response object.
    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("getWordDetails Error:", error);
    return {};
  }
};

export const generateCoreImage = async (term: string, meaning: string): Promise<string | null> => {
  try {
    // Using gemini-2.5-flash-image for generating educational images from prompts.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `${term} (${meaning}) の教育用コアイメージ画像。文字なし。` }]
      }
    });
    // Iterate through parts to find the inlineData image part.
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? `data:image/png;base64,${part.inlineData.data}` : null;
  } catch (error) {
    console.error("generateCoreImage Error:", error);
    return null;
  }
};

export const getDiagnosticQuiz = async (level: string): Promise<any[]> => {
  try {
    // Using gemini-3-flash-preview for generating structured quiz content.
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `英検${level}の頻出単語10個をJSON形式で生成してください。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              meaning: { type: Type.STRING }
            }
          }
        }
      }
    });
    // Access the text property directly.
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("getDiagnosticQuiz Error:", error);
    return [];
  }
}