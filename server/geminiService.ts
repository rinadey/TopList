import { GoogleGenAI, Type } from '@google/genai';
import { RankedItem, ListSize } from '../src/types/game.ts';

let aiInstance: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({});
  }
  return aiInstance;
}

export async function generateRankedList(topic: string, size: ListSize): Promise<RankedItem[]> {
  const client = getAiClient();
  if (!client) {
    console.warn('No GEMINI_API_KEY available, creating structured algorithmic fallback list');
    return generateFallbackList(topic, size);
  }

  try {
    const prompt = `You are the game engine for a trivia game called "Top List".
Generate a ranked list of exactly ${size} items for the topic: "${topic}".
Criteria:
- Rank #1 must be the absolute most famous/popular/iconic item in this category worldwide.
- The highest number (#${size}) should be a recognizable and valid item in this category, but significantly less obvious or lower in general rank than #1.
- The scoring of the game awards #1 = 1 point, and #${size} = ${size} points, so players strategize to guess items closer to #${size}.
- Every item must be distinct, non-duplicate, and authentic.
- Include 1 to 4 common aliases, alternate spellings, or abbreviations for each item so fuzzy matching is fair.

Return JSON in this format:
[
  {
    "rank": 1,
    "title": "Item Name",
    "aliases": ["alt 1", "alt 2"]
  },
  ...
]`;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              rank: { type: Type.INTEGER },
              title: { type: Type.STRING },
              aliases: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['rank', 'title'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    const parsed = JSON.parse(text) as Array<{ rank: number; title: string; aliases?: string[] }>;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Invalid JSON format from Gemini');
    }

    // Ensure we have exact count and correct ranks
    const sorted: RankedItem[] = parsed.slice(0, size).map((item, index) => ({
      rank: index + 1,
      title: item.title.trim(),
      aliases: (item.aliases || []).map(a => a.trim()).filter(Boolean),
    }));

    if (sorted.length < size) {
      // pad with algorithmic fallback if fewer than requested
      const fallback = generateFallbackList(topic, size);
      for (let i = sorted.length; i < size; i++) {
        sorted.push(fallback[i]);
      }
    }

    return sorted;
  } catch (error) {
    console.error('Error generating ranked list with Gemini:', error);
    return generateFallbackList(topic, size);
  }
}

function generateFallbackList(topic: string, size: ListSize): RankedItem[] {
  // A clean fallback if network/key issues arise for a custom topic
  const baseItems: RankedItem[] = [];
  for (let i = 1; i <= size; i++) {
    baseItems.push({
      rank: i,
      title: `${topic} Item #${i}`,
      aliases: [`${topic} ${i}`, `Item ${i}`],
    });
  }
  return baseItems;
}
