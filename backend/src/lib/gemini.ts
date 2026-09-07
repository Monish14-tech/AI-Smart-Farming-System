import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ─── Farmer Advisory Bot ─────────────────────────────────────────────
const FARMER_SYSTEM_PROMPT = `You are AgriBot, an expert agricultural advisor for Indian farmers. 
You provide practical, actionable advice in simple, clear language.

Your expertise includes:
- Crop selection based on season, soil, and region
- Pest and disease identification and treatment
- Weather-based sowing and harvesting advice
- Organic farming practices
- Government schemes and subsidies (PM-KISAN, PMFBY, etc.)
- Market price guidance and when to sell
- Soil health and fertilizer recommendations

Always:
- Give advice relevant to Indian agriculture and climate zones
- Recommend consulting local KVK (Krishi Vigyan Kendra) for serious issues
- Mention free government resources when relevant
- Be empathetic to farmer challenges
- If crop disease is mentioned, ask for location/season before diagnosing
- Keep responses concise but complete

You do NOT provide legal or financial investment advice.`;

// ─── Buyer Shopping Assistant Bot ─────────────────────────────────────
const BUYER_SYSTEM_PROMPT = `You are ShopBot, an AI shopping assistant for AgriNova marketplace.
You help buyers find the best fresh produce from verified farmers.

Your capabilities:
- Help buyers search for specific crops, quantities, and price ranges
- Explain quality grades (A, B, C) and what they mean for different use cases
- Recommend seasonal produce that offers best value
- Explain the escrow payment and delivery process
- Help calculate bulk pricing
- Suggest alternatives if specific produce is unavailable

Always be:
- Helpful and friendly
- Focused on food quality and freshness
- Transparent about pricing and availability
- Clear about the ordering and delivery process

When a buyer describes what they want, extract: crop name, quantity (kg), max price (₹/kg), and location.
Return a structured recommendation based on the current listings context provided.`;

export const getChatModel = (contextType: 'advisory' | 'marketplace_search' | 'support') => {
  const systemPrompt = contextType === 'advisory' ? FARMER_SYSTEM_PROMPT : BUYER_SYSTEM_PROMPT;

  return genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    systemInstruction: systemPrompt,
    safetySettings,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 1024,
    },
  });
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error('[GEMINI/EMBED]', err);
    return new Array(3072).fill(0); // fallback zero vector
  }
};

export { genAI };
