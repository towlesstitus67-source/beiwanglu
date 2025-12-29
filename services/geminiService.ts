
import { GoogleGenAI, Type } from "@google/genai";
import { Task } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateSubtasks = async (taskTitle: string): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a list of 3-5 concise, actionable subtasks for the following main task: "${taskTitle}". Return only a JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return [];
  }
};

export const getBoardSummary = async (tasks: Task[]): Promise<string> => {
  const ai = getAI();
  const summaryContext = tasks.map(t => `- [${t.status}] ${t.title}`).join('\n');
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a project management assistant. Here is the current state of a task board:\n${summaryContext}\n\nProvide a very short (2-3 sentences) motivational summary of progress and suggest what the team should focus on next. Use a friendly tone.`,
  });

  return response.text || "Keep up the great work!";
};
