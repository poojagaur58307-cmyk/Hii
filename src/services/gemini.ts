import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface NewsSource {
  uri: string;
  title: string;
}

export async function streamNewsBriefing(
  topic: string,
  language: string,
  onTextChunk: (text: string) => void,
  onSources: (sources: NewsSource[]) => void
): Promise<void> {
  const prompt = `Provide a comprehensive and objective news briefing on the following topic: "${topic}". 
Focus on the most recent events from today or the last few hours. 
Write in a calm, clear, and journalistic tone. 
The entire response MUST be written in ${language}.
Structure the response with clear headings and bullet points where appropriate.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const allSources: NewsSource[] = [];

    for await (const chunk of responseStream) {
      if (chunk.text) {
        onTextChunk(chunk.text);
      }
      
      // Extract URLs if available in this chunk
      const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      let hasNewSources = false;
      
      for (const gChunk of groundingChunks) {
        if (gChunk.web && gChunk.web.uri && gChunk.web.title) {
          // Avoid duplicates
          if (!allSources.some(s => s.uri === gChunk.web.uri)) {
            allSources.push({
              uri: gChunk.web.uri,
              title: gChunk.web.title,
            });
            hasNewSources = true;
          }
        }
      }
      
      if (hasNewSources) {
        onSources([...allSources]);
      }
    }
  } catch (error) {
    console.error("Error fetching news:", error);
    throw new Error("Failed to fetch news. Please try again later.");
  }
}

export async function generateNewsImage(topic: string): Promise<string | null> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: apiKey as string });
  
  try {
    // 1. Use Search to find the real-time subject of the news
    const entityResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Find the current top news headline for the topic: "${topic}". 
      Identify the single most prominent entity (Person, Country, Organization, or Company) in that top story.
      Return ONLY the exact Wikipedia article title for that entity. 
      - If the entity is a country, return "Flag of [Country Name]" (e.g., "Flag of Iran").
      - If it's a person, return their full name (e.g., "Donald Trump").
      - If it's a company, return the company name (e.g., "Apple Inc.").
      Return ONLY the title, no quotes, no extra text.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    let entity = entityResponse.text?.trim().replace(/["']/g, '');
    
    // Basic validation to ensure it's just a title, not a full sentence
    if (entity && entity.length < 60 && !entity.toLowerCase().includes("cannot") && !entity.toLowerCase().includes("i am")) {
      // 2. Fetch real image from Wikipedia
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(entity)}&prop=pageimages&format=json&pithumbsize=1000&origin=*`;
      const wikiRes = await fetch(wikiUrl);
      const wikiData = await wikiRes.json();
      
      const pages = wikiData.query?.pages;
      if (pages) {
        const pageIds = Object.keys(pages);
        if (pageIds.length > 0 && pageIds[0] !== "-1") {
          const imageUrl = pages[pageIds[0]]?.thumbnail?.source;
          if (imageUrl) {
            return imageUrl;
          }
        }
      }
    }
  } catch (e) {
    console.error("Wikipedia image fetch failed", e);
  }

  // 3. Fallback to Gemini Image Generation
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: `A realistic, editorial news photograph representing the topic: ${topic}. No text in the image.`,
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
  }
  return null;
}
