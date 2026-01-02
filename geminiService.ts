
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Mood, Budget, Recommendation, User } from "./types";

/**
 * Helper to delay execution.
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper to call Gemini API with exponential backoff retry logic.
 */
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isRateLimit = error?.message?.includes('429') || error?.status === 'RESOURCE_EXHAUSTED';
      if (isRateLimit && i < maxRetries - 1) {
        const waitTime = Math.pow(2, i) * 1000;
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

/**
 * Service to interact with Gemini API for culinary recommendations.
 */
export const getChefRecommendation = async (
  mood: Mood | null,
  budget: Budget,
  user: User,
  context?: string
): Promise<Recommendation> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const now = new Date();
  const hours = now.getHours();
  const season = getSeason(now.getMonth());
  const timeOfDay = hours < 12 ? "Morning" : hours < 18 ? "Afternoon" : "Evening";

  const locationContext = user.location 
    ? `The user is currently at coordinates: Latitude ${user.location.latitude}, Longitude ${user.location.longitude}.`
    : "Location data is not provided.";

  const prompt = `
    You are "The Culinary Comforter," a world-class chef who blends psychology, nutrition, and haute cuisine.
    
    TASK: Recommend a personalized gourmet dish that fuses the user's HERITAGE with their CURRENT LOCALITY.
    
    USER PROFILE:
    - Name: ${user.fullName}
    - Age: ${user.age}
    - Nationality (The Soul): ${user.nationality}
    - Current Location (The Source): ${locationContext}
    
    CONSTRAINTS:
    - Dietary: ${user.dietaryPreferences.length > 0 ? user.dietaryPreferences.join(", ") : "None"}
    - Allergies: ${user.allergies || "None"}
    - Mood: ${mood || "Refer to context"}
    - Budget: ${budget}
    - Time/Season: ${timeOfDay} / ${season}
    - User Context: ${context || "Open inspiration"}
    
    CREATIVE DIRECTION:
    The dish MUST be a sophisticated blend. If they are Italian but in New York, suggest a high-end fusion that respects their roots while using local inspiration.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dishName: { type: Type.STRING },
          energyMatch: { type: Type.STRING },
          moodExplanation: { type: Type.STRING },
          estimatedCost: { type: Type.STRING },
          keyIngredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
          bestFor: { type: Type.STRING },
          prepTime: { type: Type.STRING },
          chefTip: { type: Type.STRING },
        },
        required: ["dishName", "energyMatch", "moodExplanation", "estimatedCost", "keyIngredients", "instructions", "bestFor", "prepTime", "chefTip"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as Recommendation;
};

/**
 * Generates the main hero image for a dish.
 */
export const generateMainImage = async (dishName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    return await callWithRetry(async () => {
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A high-end, professional culinary photograph of ${dishName}. Beautiful plating, gourmet restaurant quality, soft natural lighting.` }],
        },
        config: { imageConfig: { aspectRatio: "16:9" } }
      });
      const data = resp.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
      if (!data) throw new Error("No image data");
      return `data:image/png;base64,${data}`;
    });
  } catch (e) {
    return `https://picsum.photos/seed/${encodeURIComponent(dishName)}/800/450`;
  }
};

/**
 * Generates an image for a specific cooking step.
 */
export const generateStepImage = async (step: string, dishName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    return await callWithRetry(async () => {
      const resp = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: `A professional close-up culinary action shot showing: ${step}. Focusing on the texture of ingredients for ${dishName}.` }],
        },
        config: { imageConfig: { aspectRatio: "4:3" } }
      });
      const data = resp.candidates?.[0]?.content?.parts.find(p => p.inlineData)?.inlineData?.data;
      if (!data) throw new Error("No image data");
      return `data:image/png;base64,${data}`;
    });
  } catch (e) {
    throw e;
  }
};

/**
 * Generates a mentored audio narration in a single high-speed step.
 */
export const generateAudioNarration = async (recommendation: Recommendation, userName: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const firstName = userName.split(' ')[0] || "Friend";

  // Single-step prompt for the TTS model to generate content and voice simultaneously
  const fastPrompt = `
    You are "The Culinary Comforter," a high-end chef and mentor. 
    Perform a warm, sensory-focused audio narration for ${firstName} preparing "${recommendation.dishName}".
    
    Structure:
    1. Warm greeting to ${firstName}.
    2. Briefly explain why this dish matches their emotional state: "${recommendation.moodExplanation}".
    3. Narrate the following steps as a mentor would, focusing on aromas and textures: ${recommendation.instructions.join('. ')}.
    4. Close with an encouraging culinary wisdom.
    
    STRICT: Keep it concise (150 words max) to ensure fast delivery. Voice tone: Professional, calm, mentoring.
  `;

  const response = await callWithRetry(async () => {
    return await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: fastPrompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio data received");
  return base64Audio;
};

function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Autumn";
  return "Winter";
}
