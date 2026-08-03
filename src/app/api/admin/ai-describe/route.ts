import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Add OPENAI_API_KEY to environment variables." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    // Ensure full URL — relative paths need the site origin prepended
    let fullImageUrl = imageUrl;
    if (imageUrl.startsWith("/")) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thriftcollision.com";
      fullImageUrl = `${siteUrl}${imageUrl}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `You are a product listing assistant for a Nigerian thrift streetwear store called Thrift Collision. Given a product image, extract details and respond ONLY with valid JSON (no markdown, no code fences). Use this exact format:
{
  "name": "short descriptive product name",
  "category": "Clothing" or "Accessories" or "Shoes",
  "subcategory": "one of: Jackets, T-shirts, Shirts, Jerseys, Cargo pants, Jeans, Shorts, Track suits, Trackpants, Sweatpants, Sweatshirts, Hoodies, Dresses, Caps and hats, Socks, Ties, Beanies, Gloves, Bags, Belts, Scarves, Clogs, Slippers, Sneakers, Sandals, Boots, Loafers",
  "colours": ["array of colours visible"],
  "size": "estimated size if visible (S, M, L, XL) or empty string",
  "description": "2-3 sentence product description for the listing, mention condition, style, and fit"
}
Be concise with names. For jerseys, mention the team/player if visible. For branded items, mention the brand.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Describe this thrift product for our store listing:" },
            { type: "image_url", image_url: { url: fullImageUrl, detail: "low" } },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content?.trim() || "";

    // Parse JSON from response (handle potential markdown code fences)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "AI response was not valid JSON", raw: content }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("AI describe error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze image" },
      { status: 500 }
    );
  }
}
