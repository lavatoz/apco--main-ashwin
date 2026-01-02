
import { GoogleGenAI } from "@google/genai";
import type { Client, Invoice, InvoiceItem } from "../types";

export const generateEmailDraft = async (
  type: 'welcome' | 'payment_reminder' | 'thank_you',
  client: Client,
  invoice?: Invoice
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let prompt = "";
  const brandName = client.brand; 
  const currency = "₹";
  
  const eventContext = brandName === 'AAHA Kalyanam' 
    ? "an elegant Indian wedding" 
    : "a joyful child's event";

  // Fix: Client interface uses projectName instead of name
  if (type === 'welcome') {
    prompt = `Write a warm, professional welcome email for a client named ${client.projectName} from "${brandName}". Their event is scheduled for ${client.weddingDate}. Context: This is for ${eventContext}. Tone: Respectful (Namaste), warm, and reassuring. Keep it under 150 words.`;
  } else if (type === 'payment_reminder' && invoice) {
    const total = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // Fix: Client interface uses projectName instead of name
    prompt = `Write a polite but firm payment reminder email for ${client.projectName} from "${brandName}". Invoice #${invoice.id} is due on ${invoice.dueDate} for the amount of ${currency}${total}. Tone: Professional yet gentle. Keep it under 100 words.`;
  } else if (type === 'thank_you') {
    // Fix: Client interface uses projectName instead of name
    prompt = `Write a heartfelt thank you note for ${client.projectName} after their event on ${client.weddingDate}. Brand: "${brandName}". Tone: Celebratory, grateful, and mentioning blessings. Keep it under 100 words.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate content.";
  } catch (error) {
    console.error(error);
    return "Error generating content.";
  }
};

export const generateEmotionalGreeting = async (
  client: Client, 
  milestone: 'Birthday' | 'Anniversary'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const brand = client.brand;
  // Fix: Client interface does not have dateOfBirth; it is on Person. Accessing the first person in project as a fallback.
  const originalDate = milestone === 'Anniversary' ? client.weddingDate : (client.people[0]?.dateOfBirth || '');
  
  // Fix: Client interface uses projectName instead of name
  const prompt = `Act as a warm relationship manager for Artisans Co. 
  Generate a personalized WhatsApp message for ${client.projectName}. 
  Occasion: ${milestone}.
  History: We captured their ${brand === 'AAHA Kalyanam' ? 'Wedding' : 'Kids Birthday'} back on ${client.weddingDate}.
  Goal: Send love and blessings, subtly reminding them that we are here for their future celebrations.
  Tone: Emotional, 'Namaste' style, heartfelt, and warm. Use emojis. Keep it under 80 words.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate greeting.";
  } catch (error) {
    console.error(error);
    return "Error generating greeting.";
  }
};

export const generateSocialCaption = async (client: Client, theme: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const brand = client.brand;
  // Fix: Client interface uses projectName instead of name
  const prompt = `Generate 3 catchy Instagram captions for an event photo from ${brand}. 
  Client Name: ${client.projectName}. 
  Event Type: ${brand === 'AAHA Kalyanam' ? 'Wedding/Marriage' : 'Kids/Children Birthday'}.
  Theme: ${theme}. 
  Include relevant hashtags like #ArtisansCo and Indian event specific ones. Use emojis. Tone: ${brand === 'AAHA Kalyanam' ? 'Classy and emotional' : 'Fun and colorful'}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate captions.";
  } catch (error) {
    console.error(error);
    return "Error generating captions.";
  }
};

export const generatePromoScript = async (client: Client, offerDetails?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const brand = client.brand;
  // Fix: Client interface uses projectName instead of name
  const prompt = `Generate 3 distinct promotional WhatsApp scripts for ${client.projectName}.
  Client History: We did their ${brand} shoot on ${client.weddingDate}.
  Specific Offer/New Service to highlight: ${offerDetails || 'General loyalty discount on next booking'}.
  
  Instructions:
  1. Variation 1 (The Nostalgic): Focus on the memories we captured and suggest capturing more.
  2. Variation 2 (The Deal): Focus heavily on the specific offer/discount.
  3. Variation 3 (The New Service): Focus on a new technical service (like 4K drone or Cinematic Reels).
  
  Tone: Professional Indian English, warm, 'Namaste' greeting, and clear CTA. Use Emojis. Max 80 words per variation.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate promo script.";
  } catch (error) {
    console.error(error);
    return "Error generating promo script.";
  }
};

export const generateEventConcept = async (client: Client): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Fix: Client interface uses projectName instead of name
  const prompt = `Generate a creative event concept/mood for ${client.projectName}'s next celebration. 
  They previously worked with our ${client.brand} division. 
  Suggest a unique theme, a color palette, and one signature "Artisans Co." technical shot (e.g., slow-mo entry or drone reveal). Keep it inspiring and under 100 words.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Could not generate concept.";
  } catch (error) {
    console.error(error);
    return "Error generating concept.";
  }
};

export const analyzeBusinessTrends = async (monthlyRevenue: {name: string, value: number}[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const dataString = JSON.stringify(monthlyRevenue);
  const prompt = `Analyze this monthly revenue data (in INR) for AP Co. (an Indian event company): ${dataString}. Provide a brief 2-sentence summary of the trend and one actionable tip for growth in the Indian wedding/event market.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "No analysis available.";
  } catch (error) {
    console.error(error);
    return "Error analyzing trends.";
  }
};
