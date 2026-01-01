import { GoogleGenAI } from "@google/genai";
import type { Client, Invoice } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing from environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateEmailDraft = async (
  type: 'welcome' | 'payment_reminder' | 'thank_you',
  client: Client,
  invoice?: Invoice
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Service Unavailable: Missing API Key.";

  let prompt = "";
  const brandName = client.brand; // Aaha Kalayanam or Tiny Toes
  const currency = "₹";
  
  const eventContext = brandName === 'Aaha Kalayanam' 
    ? "an elegant Indian wedding" 
    : "a joyful child's event (like a naming ceremony or birthday)";

  if (type === 'welcome') {
    prompt = `Write a warm, professional welcome email for a client named ${client.name} from "${brandName}". 
    Their event is scheduled for ${client.weddingDate}. 
    Context: This is for ${eventContext}. 
    Tone: Respectful (Namaste), warm, and reassuring. Keep it under 150 words.`;
  } else if (type === 'payment_reminder' && invoice) {
    const total = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    prompt = `Write a polite but firm payment reminder email for ${client.name} from "${brandName}". 
    Invoice #${invoice.id} is due on ${invoice.dueDate} for the amount of ${currency}${total}. 
    Tone: Professional yet gentle. Keep it under 100 words.`;
  } else if (type === 'thank_you') {
    prompt = `Write a heartfelt thank you note for ${client.name} after their event on ${client.weddingDate}. 
    Brand: "${brandName}". 
    Tone: Celebratory, grateful, and mentioning blessings. Keep it under 100 words.`;
  } else {
    return "Invalid request type.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate email draft.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please try again later.";
  }
};

export const analyzeBusinessTrends = async (monthlyRevenue: {name: string, value: number}[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Service Unavailable.";

  const dataString = JSON.stringify(monthlyRevenue);
  const prompt = `Analyze this monthly revenue data (in INR) for AP Co. (an Indian event company): ${dataString}. Provide a brief 2-sentence summary of the trend and one actionable tip for growth in the Indian wedding/event market.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error(error);
    return "Error analyzing trends.";
  }
};

export const generateStatusUpdate = async (client: Client): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "AI Service Unavailable.";

  const timeline = client.portal?.timeline || [];
  const deliverables = client.portal?.deliverables || [];
  const completedSteps = timeline.filter(t => t.status === 'Completed').map(t => t.title).join(', ');
  const nextStep = timeline.find(t => t.status !== 'Completed');
  const links = deliverables.map(d => `${d.title}: ${d.url}`).join('\n');

  const prompt = `
    Generate a professional status update message (formatted for WhatsApp or Email) for client ${client.name}.
    Brand: ${client.brand}.
    Event Date: ${client.weddingDate}.
    
    Progress So Far: ${completedSteps || 'Project Initiated'}.
    Next Step: ${nextStep ? nextStep.title : 'Project Completion'}.
    
    Deliverable Links:
    ${links}

    Tone: Professional, exciting, and convenient. Use relevant emojis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate status update.";
  } catch (error) {
    console.error(error);
    return "Error generating update.";
  }
};