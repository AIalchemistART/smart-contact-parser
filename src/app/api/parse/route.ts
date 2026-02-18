import { NextRequest, NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, images, userInstructions, preferences, apiKey, batchMode, alreadyFound } = body;

    if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Valid OpenAI API key required. Enter your key in Settings." },
        { status: 400 }
      );
    }

    const hasText = text && typeof text === "string" && text.trim().length > 0;
    const hasImages = Array.isArray(images) && images.length > 0;

    if (!hasText && !hasImages) {
      return NextResponse.json(
        { error: "No input provided. Paste text or upload an image." },
        { status: 400 }
      );
    }

    const parsedPrefs = Array.isArray(preferences)
      ? preferences.filter((p: { rule: string; active: boolean }) => p.active)
      : [];

    const systemPrompt = buildSystemPrompt(parsedPrefs, !!batchMode, alreadyFound);

    let userText = hasText ? (text as string).trim() : "";
    if (userInstructions && (userInstructions as string).trim()) {
      userText += `\n\n---\nADDITIONAL USER INSTRUCTIONS:\n${(userInstructions as string).trim()}`;
    }

    type ChatPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "high" } };

    const chatParts: ChatPart[] = [];
    chatParts.push({ type: "text", text: userText || "Extract contact information from the attached image(s)." });

    if (hasImages) {
      for (const img of images as { data: string; mimeType: string }[]) {
        chatParts.push({
          type: "image_url",
          image_url: { url: `data:${img.mimeType};base64,${img.data}`, detail: "high" },
        });
      }
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: chatParts },
        ],
        max_tokens: 16000,
        temperature: 0.2,
      }),
    });

    if (!openaiRes.ok) {
      const errorBody = await openaiRes.text();
      let errorMsg = `OpenAI API error ${openaiRes.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMsg = parsed.error?.message || errorMsg;
      } catch {
        if (errorBody) errorMsg += `: ${errorBody.slice(0, 200)}`;
      }
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    const responseData = await openaiRes.json();
    const content = responseData.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "AI returned an empty response. Please try again." }, { status: 500 });
    }

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "AI returned invalid JSON. Please try again.", raw: content }, { status: 500 });
    }

    const rawContacts = Array.isArray(parsed.contacts) ? parsed.contacts : [parsed];
    const contacts = rawContacts.map((c: Record<string, unknown>) => ({
      firstName: (c.firstName as string) || "",
      lastName: (c.lastName as string) || "",
      email: (c.email as string) || "",
      phone: (c.phone as string) || "",
      additionalEmail: (c.additionalEmail as string) || "",
      additionalPhone: (c.additionalPhone as string) || "",
      company: (c.company as string) || "",
      opportunityName: (c.opportunityName as string) || "",
      pipeline: (c.pipeline as string) || "",
      stage: (c.stage as string) || "",
      opportunityValue: (c.opportunityValue as string) || "",
      status: (c.status as string) || "",
      lostReason: (c.lostReason as string) || "",
      jobTitle: (c.jobTitle as string) || "",
      address: (c.address as string) || "",
      city: (c.city as string) || "",
      state: (c.state as string) || "",
      zip: (c.zip as string) || "",
      website: (c.website as string) || "",
      source: (c.source as string) || "",
      tags: (c.tags as string) || "",
      notes: Array.isArray(c.notes)
        ? (c.notes as unknown[]).map((n: unknown) => {
            if (typeof n === "string") return { content: n, date: "" };
            if (typeof n === "object" && n !== null) {
              const obj = n as { content?: string; date?: string };
              return { content: obj.content || "", date: obj.date || "" };
            }
            return { content: String(n), date: "" };
          })
        : [],
      confidence: c.confidence && typeof c.confidence === "object" ? (c.confidence as Record<string, string>) : {},
      suggestedTags: Array.isArray(c.suggestedTags) ? (c.suggestedTags as string[]) : [],
      detectedSource: typeof c.detectedSource === "string" ? c.detectedSource : "",
    }));

    const promptTokens = responseData.usage?.prompt_tokens || 0;
    const completionTokens = responseData.usage?.completion_tokens || 0;
    return NextResponse.json({
      contacts,
      modelUsed: "gpt-4o",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: responseData.usage?.total_tokens || promptTokens + completionTokens,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[parse] Error:", message);
    return NextResponse.json({ error: `AI parsing failed: ${message}` }, { status: 500 });
  }
}
