import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60; // Max timeout for Vercel/Next.js edge cases

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64 || !mimeType) {
      return NextResponse.json({ error: "Missing image data" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured in .env.local" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const prompt = `
      You are an expert at extracting menu items from restaurant menus.
      Extract all the menu items from the provided image.
      
      Return a JSON object with a single property 'items' which is an array of objects.
      Each object must have the following properties:
      - name: string (the name of the dish)
      - price: number (the price as a plain number, strip out any currency symbols like ₹ or $)
      - description: string (a short description if available, otherwise empty string)
      - isVeg: boolean (true if the item is vegetarian/veg, false if non-veg, default to true if unknown)
      - category: string (the category this item belongs to, e.g., 'Starters', 'Main Course', 'Beverages')

      Ensure the output is strictly valid JSON without any markdown formatting blocks.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("Empty response from AI");
    }

    const data = JSON.parse(text);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[API/Menu/Parse] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to parse menu image" },
      { status: 500 }
    );
  }
}
