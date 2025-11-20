import { GoogleGenAI, Type, Modality, Chat } from "@google/genai";
import { decode, decodeAudioData, getAudioContext } from "../utils/audio";
import { MeditationSession } from "../types";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates the meditation script and image prompt using Gemini 3 Pro.
 */
export const generateMeditationContent = async (mood: string, focus: string, duration: string): Promise<MeditationSession> => {
  const model = "gemini-3-pro-preview";
  
  const prompt = `
    Create a guided meditation script for a user who is feeling "${mood}" and wants to focus on "${focus}".
    The duration should be roughly ${duration} (Short = 100 words, Medium = 200 words, Long = 300 words).
    
    Return a JSON object with:
    1. "title": A calming title for the session.
    2. "script": The spoken text for the meditation guide. It should be soothing, spaced out, and direct.
    3. "imagePrompt": A detailed, artistic prompt to generate a serene background image using an AI image generator. Describe a scene that matches the mood (e.g., "A misty forest at dawn with soft golden light").
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          script: { type: Type.STRING },
          imagePrompt: { type: Type.STRING },
        },
        required: ["title", "script", "imagePrompt"],
      },
    },
  });

  const json = JSON.parse(response.text || "{}");
  
  return {
    title: json.title || "Meditation Session",
    script: json.script || "",
    imagePrompt: json.imagePrompt || "A peaceful abstract landscape with soft colors",
  };
};

/**
 * Generates the background image using Imagen 4.
 */
export const generateMeditationImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `${prompt}, photorealistic, 8k, serene, cinematic lighting, peaceful atmosphere`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '3:4', // Portrait-ish for mobile/web
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    return "https://picsum.photos/800/1200"; // Fallback
  } catch (error) {
    console.error("Image generation failed:", error);
    return "https://picsum.photos/800/1200"; // Fallback
  }
};

/**
 * Generates speech from text using Gemini TTS.
 */
export const generateMeditationAudio = async (text: string): Promise<AudioBuffer | undefined> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' }, // Kore is usually a good calm voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const ctx = getAudioContext();
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      ctx,
      24000,
      1
    );
    
    return audioBuffer;
  } catch (error) {
    console.error("Audio generation failed:", error);
    return undefined;
  }
};

// Chat instance singleton to maintain history
let chatSession: Chat | null = null;

export const getChatSession = () => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: "You are a wise, empathetic, and calming meditation teacher. Keep answers concise and soothing.",
      },
    });
  }
  return chatSession;
};

export const sendMessageToGuide = async (message: string): Promise<string> => {
  const chat = getChatSession();
  try {
    const result = await chat.sendMessage({ message });
    return result.text || "I am here with you. Take a deep breath.";
  } catch (e) {
    console.error(e);
    return "I'm having trouble connecting to the universal energy (API error). Please try again.";
  }
};