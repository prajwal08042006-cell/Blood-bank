
import { GoogleGenAI, Type } from "@google/genai";
import { BloodGroup, DonorMatch, UserProfile, Location } from "../types";
import { logger } from "../lib/logger";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// --- MOCK DATA GENERATORS ---
const getMockMatchData = (donors: UserProfile[]): DonorMatch[] => {
  return donors.map(d => ({
    donor: d,
    score: Math.floor(Math.random() * 30) + 70, // 70-100 match score
    distanceKm: parseFloat((Math.random() * 5 + 0.5).toFixed(1)),
    reason: "High compatibility based on blood group and recent availability."
  })).sort((a, b) => b.score - a.score);
};

const mockChatResponses = [
  "I can help you locate the nearest blood bank. Could you please share your current location?",
  "O+ is a universal donor for positive blood types. Your donation can save up to 3 lives!",
  "To donate blood, you must be 18-65 years old and weigh at least 45kg.",
  "I've found 3 urgent requests matching your blood group nearby. Would you like to see them?"
];

/**
 * Uses Gemini to rank donors based on complex factors.
 */
export async function getAiDonorMatching(
  requestGroup: BloodGroup,
  targetLocation: Location,
  availableDonors: UserProfile[]
): Promise<DonorMatch[]> {
  // Fallback if no key or placeholder
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    logger.warn("Using Mock AI Service for Donor Matching");
    return new Promise(resolve => setTimeout(() => resolve(getMockMatchData(availableDonors)), 1000));
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash', // Updated to stable model
      contents: `Given a blood request for ${requestGroup} at location ${JSON.stringify(targetLocation)}, 
      rank the following donors based on:
      1. Compatibility (O- is universal, etc.)
      2. Distance
      3. Last donation date (must be > 90 days)
      4. Impact score.
      
      Donors: ${JSON.stringify(availableDonors)}
      
      Return a JSON array of objects with { donorId: string, score: number (0-100), reason: string }.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              donorId: { type: Type.STRING },
              score: { type: Type.NUMBER },
              reason: { type: Type.STRING }
            },
            required: ['donorId', 'score', 'reason']
          }
        }
      }
    });

    const results = JSON.parse(response.text || '[]');

    return results.map((res: any) => {
      const donor = availableDonors.find(d => d.id === res.donorId)!;
      return {
        donor,
        score: res.score,
        reason: res.reason,
        distanceKm: Math.random() * 5 // Mock distance calculation as AI doesn't compute real distance yet
      };
    }).sort((a: any, b: any) => b.score - a.score);
  } catch (error) {
    logger.error("AI Matching failed, defaulting to mock", error);
    return getMockMatchData(availableDonors);
  }
}

/**
 * Uses Gemini with Maps tool to find nearby facilities.
 */
export async function findNearbyHospitals(location: Location) {
  // Fallback if no key
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    return {
      text: "I found several hospitals nearby: Apollo Hospital (2km), Manipal Hospital (3.5km), and Victoria Hospital (5km).",
      sources: []
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Updated model
      contents: `Find 3 major hospitals near latitude ${location.lat}, longitude ${location.lng} with emergency departments.`,
      config: {
        tools: [{ googleMaps: {} }],
      }
    });

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    logger.error("Maps grounding failed", error);
    return null;
  }
}

/**
 * Chatbot implementation for user queries.
 */
export async function getChatResponse(message: string, history: { role: string, parts: { text: string }[] }[]) {
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    await new Promise(r => setTimeout(r, 800)); // Simulate delay
    return mockChatResponses[Math.floor(Math.random() * mockChatResponses.length)];
  }

  try {
    const chat = ai.chats.create({
      model: 'gemini-1.5-flash',
      config: {
        systemInstruction: 'You are BloodLife AI assistant. You help users find blood donors, explain blood donation eligibility, and provide emergency guidance. Be empathetic, professional, and clear.'
      },
      history: history
    });

    const response = await chat.sendMessage({ message });
    return response.text;
  } catch (error) {
    logger.error("Chat Error", error);
    return "I'm having trouble connecting to the network right now. Please check your connection or try again later.";
  }
}
