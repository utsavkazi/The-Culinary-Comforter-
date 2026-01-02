
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
      const errorMsg = error?.message || "";
      const isRateLimit = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED');
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
    : "Location data is currently unavailable, use global seasonal inspiration.";

  const prompt = `
    You are "The Culinary Comforter," a world-class chef who blends psychology, nutrition, and haute cuisine.
    
    TASK: Recommend a personalized gourmet dish that fuses the user's nationality (${user.nationality}) with their current context.
    
    USER PROFILE:
    - Name: ${user.fullName}
    - Age: ${user.age}
    - Current Context: ${locationContext}
    
    STRICT CONSTRAINTS (CRITICAL):
    - Dietary Restrictions: ${user.dietaryPreferences.length > 0 ? user.dietaryPreferences.join(", ") : "None"}
    - Allergies (NEVER USE THESE INGREDIENTS): ${user.allergies || "None"}
    
    CONTEXTUAL CONSTRAINTS:
    - Mood/Vibe: ${mood || "Refer to context"}
    - Budget Level: ${budget}
    - Current Time/Season: ${timeOfDay} in ${season}
    - Personal Story/Notes: ${context || "None"}
    
    CREATIVE DIRECTION:
    Provide a sophisticated, gourmet recommendation that strictly adheres to the dietary and allergy constraints. Return strictly as a JSON object.
  `;

  try {
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

    const text = response.text;
    if (!text) throw new Error("The chef is silent. (No content returned)");
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("The chef provided a recipe in an unreadable format.");
    
    return JSON.parse(jsonMatch[0]) as Recommendation;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.message?.includes('Safety')) {
      throw new Error("This request touched upon sensitive culinary boundaries. Please try describing your mood differently.");
    }
    throw error;
  }
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

  const fastPrompt = `
    You are "The Culinary Comforter," a high-end mentor chef.
    Deliver a sensory, encouraging audio guide for ${firstName} preparing "${recommendation.dishName}".
    Style: Warm, mentoring, professional. Keep it under 180 words.
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
  if (!base64Audio) {
    throw new Error("No audio data received.");
  }
  return base64Audio;
};

function getSeason(month: number): string {
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Autumn";
  return "Winter";
}
