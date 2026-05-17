
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
export async function getChatResponse(message: string, _history: { role: string, parts: { text: string }[] }[]) {
  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    await new Promise(r => setTimeout(r, 800)); // Simulate delay
    return getSmartMockResponse(message);
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: message,
      config: {
        systemInstruction: `You are BloodLife AI assistant for the BloodLife Karnataka blood donation platform. 
You help users with:
- Blood donation eligibility (age 18-65, weight ≥45kg, 90-day cooldown between donations)
- Finding nearby blood banks and hospitals
- Understanding blood group compatibility
- Emergency blood requests
- Donation history and impact scores
Be empathetic, professional, clear, and concise. Keep responses under 3 sentences unless detailed info is needed.`,
      }
    });

    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    logger.error("Chat Error", error);
    // Fall back to smart mock instead of showing an error
    return getSmartMockResponse(message);
  }
}

/**
 * Smart mock responses based on user message content.
 */
function getSmartMockResponse(message: string): string {
  const msg = message.toLowerCase();

  if (msg.includes('eligib') || msg.includes('can i donate') || msg.includes('who can')) {
    return "To donate blood, you must be between 18-65 years old, weigh at least 45kg, and have waited at least 90 days since your last donation. You should be in good health and free from infections.";
  }
  if (msg.includes('blood group') || msg.includes('blood type') || msg.includes('compatible')) {
    return "O- is the universal donor (can give to anyone), while AB+ is the universal recipient. Your blood group determines who you can donate to and receive from. Check the Live Map to see demand by blood group!";
  }
  if (msg.includes('near') || msg.includes('hospital') || msg.includes('bank') || msg.includes('where')) {
    return "You can find nearby blood banks and hospitals on our Live Map! Click 'Live Map' in the sidebar to see all registered facilities near your location with real-time stock levels.";
  }
  if (msg.includes('emergency') || msg.includes('urgent') || msg.includes('need blood')) {
    return "For urgent blood needs, use the Emergency Request feature in the sidebar. It alerts nearby donors matching the required blood group and connects you with available blood banks instantly.";
  }
  if (msg.includes('history') || msg.includes('impact') || msg.includes('score') || msg.includes('certificate')) {
    return "Your donation history and impact score are tracked in 'My Impact'. Each donation earns points, and you can unlock digital certificates as you reach milestones. Keep donating to level up!";
  }
  if (msg.includes('how') && (msg.includes('work') || msg.includes('donate'))) {
    return "BloodLife connects donors with blood banks across Karnataka. Register, verify your identity, then respond to blood requests or visit your nearest blood bank. Every donation saves up to 3 lives!";
  }
  if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) {
    return "Hello! 👋 I'm your BloodLife assistant. I can help you with donation eligibility, finding nearby blood banks, understanding blood compatibility, or managing emergency requests. What would you like to know?";
  }
  if (msg.includes('thank')) {
    return "You're welcome! Remember, every blood donation can save up to 3 lives. Is there anything else I can help you with?";
  }

  return "I can help you with blood donation eligibility, finding nearby blood banks, understanding blood group compatibility, and managing emergency requests. What would you like to know more about?";
}
