import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface AlreadyFoundContact {
  firstName: string;
  lastName: string;
  company: string;
}

function buildSystemPrompt(
  preferences: { rule: string }[],
  batchMode: boolean,
  alreadyFound?: AlreadyFoundContact[]
): string {
  let prompt = `You are a contact information parser. The user will provide unstructured text AND/OR images (photos of business cards, handwritten notes, screenshots) containing information about contacts. Your job is to extract structured contact fields from ALL provided inputs.

IMPORTANT RULES:
- Any names, phone numbers, or other contact info mentioned in NOTES context (e.g., "called John about...") should go into the notes field, NOT as separate contacts.
- If you cannot determine a field, leave it as an empty string.
- Phone numbers: normalize to a consistent format if possible.
- For notes: preserve the original text that doesn't map to structured fields. Include context, meeting notes, relationship details, etc.
- Tags: extract relevant keywords that could categorize this contact (comma-separated).
- For IMAGES: Read all visible text from business cards, handwritten notes, or screenshots. Extract contact fields the same way as text input. If handwriting is ambiguous, make your best guess and add a note about uncertainty.`;

  if (batchMode) {
    prompt += `

BATCH MODE: The input may contain information about MULTIPLE contacts. Extract ALL contacts found.
Return a JSON object: { "contacts": [ ...array of contact objects... ] }
Each contact object has the fields described below.

CRITICAL: Extract EVERY person who has contact information listed (name, phone, email, etc.), even if they have minimal data. A contact with just a name and email is still valid. A contact with just a name and role is still valid. Do NOT skip people just because they have incomplete information.`;
  } else {
    prompt += `

This input describes EXACTLY ONE contact. Never create multiple contacts.
Return a JSON object: { "contacts": [ ...single contact object... ] }`;
  }

  prompt += `

Each contact object must have EXACTLY these fields:
{
  "firstName": "",
  "lastName": "",
  "email": "",
  "phone": "",
  "additionalEmail": "",
  "additionalPhone": "",
  "company": "",
  "jobTitle": "",
  "address": "",
  "city": "",
  "state": "",
  "zip": "",
  "website": "",
  "source": "",
  "tags": "",
  "opportunityName": "",
  "pipeline": "",
  "stage": "",
  "opportunityValue": "",
  "status": "",
  "lostReason": "",
  "notes": [],
  "confidence": {},
  "suggestedTags": [],
  "detectedSource": ""
}

"phone" = primary phone number.
"additionalPhone" = secondary/mobile/alternate phone if present.
"additionalEmail" = secondary email if present.
"company" = business name / organization.

GHL OPPORTUNITY FIELDS — Infer these ONLY when context clearly justifies it. Leave empty if unsure:
- "opportunityName": A short label for the business opportunity (e.g., "Rain Gutter Solutions - NIA Membership", "[Company] - [Purpose]"). Derive from the contact's company name + the context of the relationship.
- "pipeline": The sales/relationship pipeline this contact belongs to. Infer from document context (e.g., "NIA Membership", "Referral Network", "Vendor Prospect"). Use a consistent pipeline name across contacts in the same context.
- "stage": The current stage in the pipeline. Look for contextual clues:
  * "New member" / "gave credit card" / "joined" → "Won" or "Closed"
  * "prospect drip" / "visitor drip" / "setting up meeting" → "Prospect" or "Nurturing"
  * "ABANDON" / "not a fit" / dropped out → "Lost"
  * Active engagement, multiple meetings → "Engaged" or "Negotiation"
  * Just visited / attended one event → "New Lead"
- "opportunityValue": Dollar amount if pricing/fees are mentioned in context (e.g., "$165", "$470", "$200 setup"). Use the total or recurring amount. Leave empty if no pricing context.
- "status": One of "open", "won", "lost", or "abandoned". Infer from context:
  * Paid / joined / gave credit card → "won"
  * ABANDON / not a fit / too many groups → "lost" or "abandoned"
  * Still in conversation / prospect → "open"
- "lostReason": Only fill if status is "lost" or "abandoned". Summarize WHY (e.g., "In too many other groups", "Category already taken", "Not a good fit right now").

The "confidence" field maps each contact field name to "high", "medium", or "low":
- "high" = clearly stated, no ambiguity
- "medium" = inferred or partially present
- "low" = guessed or very uncertain
Only include fields that have values.

The "suggestedTags" field is an array of 3-6 relevant tag strings inferred from the content.

The "detectedSource" field describes where the input likely came from. Use one of: "email_signature", "business_card", "linkedin", "handwritten_note", "crm_export", "website", "conversation_notes", "word_document", "other". Leave empty if unclear.

The "notes" field should be an array of objects, each with "content" (string) and "date" (string, ISO format YYYY-MM-DD or empty).
- If a date is mentioned near a note, use that date.
- If no date, use empty string.
- Group related text under the same note.
- IMPORTANT: When exporting to GoHighLevel, all notes will be aggregated into a SINGLE note cell (GHL only supports one note per contact import). So capture all relevant context -- meeting notes, relationship info, follow-up items, etc. -- as separate note entries and they will be combined on export.

IMPORTANT for email signatures: If the input looks like an email signature, treat it as structured and extract all fields with high confidence.

Return ONLY valid JSON. No markdown, no explanation, no wrapping.`;

  // Re-scan mode: tell AI which contacts were already found
  if (alreadyFound && alreadyFound.length > 0) {
    prompt += `\n\nRE-SCAN MODE: The following contacts have ALREADY been found in a previous pass. DO NOT return these again. Instead, look carefully for any contacts that were MISSED. Focus on:\n- People listed under sub-sections (after dashes/underscores) within company blocks\n- Contacts with minimal info (just name + role, or name + email)\n- Secondary contacts within the same organization\n- People mentioned in structured contact blocks that may have been overlooked\n\nALREADY FOUND (skip these):\n`;
    for (const c of alreadyFound) {
      const name = [c.firstName, c.lastName].filter(Boolean).join(" ");
      prompt += `- ${name}${c.company ? ` (${c.company})` : ""}\n`;
    }
    prompt += `\nReturn ONLY newly discovered contacts NOT in the list above. If no new contacts are found, return { "contacts": [] }.`;
  }

  if (preferences.length > 0) {
    prompt += "\n\nUSER PREFERENCES (parsing rules):\n";
    for (const pref of preferences) {
      prompt += `- ${pref.rule}\n`;
    }
  }

  return prompt;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, images, userInstructions, preferences, apiKey, batchMode } = body;

    if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Valid OpenAI API key required. Enter your key in Settings." },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey });

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

    const alreadyFound = body.alreadyFound as AlreadyFoundContact[] | undefined;
    const systemPrompt = buildSystemPrompt(parsedPrefs, !!batchMode, alreadyFound);

    // Build user message
    let userText = hasText ? text.trim() : "";
    if (userInstructions && userInstructions.trim()) {
      userText += `\n\n---\nADDITIONAL USER INSTRUCTIONS:\n${userInstructions.trim()}`;
    }

    // Build input content parts for Responses API
    type InputPart =
      | { type: "input_text"; text: string }
      | { type: "input_image"; image_url: string; detail: "high" | "low" | "auto" };

    const inputParts: InputPart[] = [];

    if (userText) {
      inputParts.push({ type: "input_text", text: "Respond with valid JSON.\n\n" + userText });
    } else {
      inputParts.push({ type: "input_text", text: "Respond with valid JSON. Extract contact information from the attached image(s)." });
    }

    if (hasImages) {
      for (const img of images as { data: string; mimeType: string }[]) {
        inputParts.push({
          type: "input_image",
          image_url: `data:${img.mimeType};base64,${img.data}`,
          detail: "high",
        });
      }
    }

    // Use Responses API (required for gpt-5.1-codex-mini)
    const response = await openai.responses.create({
      model: "gpt-5.1-codex-mini",
      instructions: systemPrompt,
      input: [{ role: "user" as const, content: inputParts }],
      max_output_tokens: 40000,
    });

    console.log("[parse] Response status:", response.status);
    console.log("[parse] output_text length:", response.output_text?.length ?? 0);
    console.log("[parse] output items:", response.output?.length ?? 0);
    console.log("[parse] usage:", JSON.stringify(response.usage));

    // Check for incomplete response
    if (response.status !== "completed") {
      console.error("[parse] Non-completed status:", response.status);
      console.error("[parse] Full output:", JSON.stringify(response.output, null, 2).slice(0, 2000));
      return NextResponse.json(
        { error: `AI response status: ${response.status}. The model may need a shorter input or different parameters.` },
        { status: 500 }
      );
    }

    // Extract text from Responses API output
    let content = response.output_text;

    // Fallback: manually extract text from output items if output_text is empty
    if (!content && response.output) {
      const textParts: string[] = [];
      for (const item of response.output) {
        if (item.type === "message" && Array.isArray(item.content)) {
          for (const part of item.content) {
            if (part.type === "output_text" && part.text) {
              textParts.push(part.text);
            }
          }
        }
      }
      content = textParts.join("");
    }

    if (!content) {
      console.error("[parse] Empty content. Full output:", JSON.stringify(response.output, null, 2).slice(0, 2000));
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again." },
        { status: 500 }
      );
    }

    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again.", raw: content },
        { status: 500 }
      );
    }

    // Normalize contacts array
    const rawContacts = Array.isArray(parsed.contacts) ? parsed.contacts : [parsed];
    const contacts = rawContacts.map((c: Record<string, unknown>) => ({
      firstName: (c.firstName as string) || "",
      lastName: (c.lastName as string) || "",
      email: (c.email as string) || "",
      phone: (c.phone as string) || "",
      additionalEmail: (c.additionalEmail as string) || "",
      additionalPhone: (c.additionalPhone as string) || (c.mobile as string) || "",
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
      confidence:
        c.confidence && typeof c.confidence === "object"
          ? (c.confidence as Record<string, string>)
          : {},
      suggestedTags: Array.isArray(c.suggestedTags) ? (c.suggestedTags as string[]) : [],
      detectedSource: typeof c.detectedSource === "string" ? c.detectedSource : "",
    }));

    return NextResponse.json({
      contacts,
      usage: {
        promptTokens: response.usage?.input_tokens || 0,
        completionTokens: response.usage?.output_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("AI parse error:", message);
    return NextResponse.json(
      { error: `AI parsing failed: ${message}` },
      { status: 500 }
    );
  }
}
