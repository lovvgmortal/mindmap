import { GoogleGenAI, Type } from "@google/genai";
import { MindMapNodeData } from '../types';
import { DEFAULT_NODE_STYLE } from '../constants';
import { generateId } from '../utils/cn';

const getClient = () => {
  const apiKey = "AIzaSyCBF8uPU0XANLUcLx1z9wpnnvROP5D3jG8";
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will return mock data.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const expandTopicWithGemini = async (topic: string): Promise<MindMapNodeData[]> => {
  const client = getClient();
  
  // Fallback mock if no key
  if (!client) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network
    return ['Idea 1', 'Idea 2', 'Idea 3'].map(text => ({
      id: generateId(),
      text: `${text} for ${topic}`,
      children: [],
      isExpanded: true,
      style: DEFAULT_NODE_STYLE
    }));
  }

  try {
    const prompt = `Generate 4 concise sub-topics or related ideas for the mind map node: "${topic}". Return only the list of strings.`;
    
    const response = await client.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ideas: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const json = JSON.parse(text);
    const ideas: string[] = json.ideas || [];

    return ideas.map(idea => ({
      id: generateId(),
      text: idea,
      children: [],
      isExpanded: true,
      style: DEFAULT_NODE_STYLE
    }));

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};
