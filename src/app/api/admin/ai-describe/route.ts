import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
          content: `You are a product listing assistant for Thrift Collision, a Nigerian thrift streetwear store based in Abuja. Write like a young Nigerian who knows fashion — casual, confident, relatable. Think of how you'd describe a piece to your guy in a WhatsApp message or IG caption. 

Tone guidelines:
- Keep it short and punchy. No corporate language.
- Use Nigerian English naturally (e.g. "this one dey hit different", "proper fit for the streets", "clean clean", "you fit rock this with...", "this piece hard no cap"). Don't overdo it — just let it flow.
- Never mention winter, summer, fall, or spring. Nigeria doesn't have those. Reference harmattan, rainy season, or just say "cool evenings" if relevant.
- Focus on how it looks and how to style it, not generic climate descriptions.

Given a product image, respond ONLY with valid JSON (no markdown, no code fences):
{
  "name": "short descriptive product name",
  "category": "Clothing" or "Accessories" or "Shoes",
  "subcategory": "one of: Jackets, T-shirts, Shirts, Polo shirt, Jerseys, Cargo pants, Cargo shorts, Jeans, Shorts, Track suits, Trackpants, Sweatpants, Sweatshirts, Hoodies, Dresses, Caps and hats, Socks, Ties, Beanies, Gloves, Bags, Belts, Scarves, Clogs, Slippers, Sneakers, Sandals, Boots, Loafers",
  "colours": ["array of colours visible"],
  "size": "estimated size if visible (S, M, L, XL) or empty string",
  "description": "2-3 sentence product description. Mention condition, vibe, and how to style it. Write in Nigerian English — natural, not forced.",
  "style_reason": "One short sentence explaining why the auto-suggested pairings would work with this item (e.g. 'The neutral tone pairs easy with dark denim or cargos — keeps the fit balanced without trying too hard.')"
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
