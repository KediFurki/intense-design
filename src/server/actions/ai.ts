"use server";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type TranslationResponse = {
  en: string;
  tr: string;
  de: string;
  bg: string;
};

export async function generateTranslations(text: string, context: string = "furniture product") {
  if (!text) return { success: false, error: "No text provided" };
  if (!process.env.OPENAI_API_KEY) return { success: false, error: "API Key missing" };

  try {
    const prompt = `
      You are a professional translator for a premium furniture store. 
      Translate the following "${context}" text into English (en), Turkish (tr), German (de), and Bulgarian (bg).
      
      Input text: "${text}"
      
      Return ONLY a valid JSON object without markdown formatting. 
      Format: { "en": "...", "tr": "...", "de": "...", "bg": "..." }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Hızlı ve ucuz model
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from AI");

    const translations = JSON.parse(content) as TranslationResponse;

    return { success: true, data: translations };
  } catch (error) {
    console.error("AI Translation Error:", error);
    return { success: false, error: "Translation failed" };
  }
}