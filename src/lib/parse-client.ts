import { ParsedContact, EMPTY_CONTACT } from "./types";
import { buildSystemPrompt } from "./prompt";

interface ParseOptions {
  text?: string;
  images?: { data: string; mimeType: string }[];
  userInstructions?: string;
  preferences: { rule: string; active?: boolean }[];
  apiKey: string;
  batchMode: boolean;
  alreadyFound?: { firstName: string; lastName: string; company: string }[];
}

interface ParseResult {
  contacts: ParsedContact[];
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  modelUsed: string;
}

export async function parseContactsClient(options: ParseOptions): Promise<ParseResult> {
  const { text, images, userInstructions, preferences, apiKey, batchMode, alreadyFound } = options;

  const hasText = text && text.trim().length > 0;
  const hasImages = images && images.length > 0;

  if (!hasText && !hasImages) {
    throw new Error("No input provided. Paste text or upload an image.");
  }

  const activePrefs = preferences.filter((p) => p.active !== false);
  const systemPrompt = buildSystemPrompt(activePrefs, batchMode, alreadyFound);

  // Build user content parts (Chat Completions format)
  type ContentPart =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string; detail: "high" } };

  const contentParts: ContentPart[] = [];

  let userText = hasText ? text!.trim() : "";
  if (userInstructions && userInstructions.trim()) {
    userText += `\n\n---\nADDITIONAL USER INSTRUCTIONS:\n${userInstructions.trim()}`;
  }

  if (userText) {
    contentParts.push({ type: "text", text: userText });
  } else {
    contentParts.push({ type: "text", text: "Extract contact information from the attached image(s)." });
  }

  if (hasImages) {
    for (const img of images!) {
      contentParts.push({
        type: "image_url",
        image_url: { url: `data:${img.mimeType};base64,${img.data}`, detail: "high" },
      });
    }
  }

  // Call OpenAI directly from the browser
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: contentParts },
      ],
      max_tokens: 8000,
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMsg = `OpenAI API error ${response.status}`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMsg = parsed.error?.message || errorMsg;
    } catch {
      if (errorBody) errorMsg += `: ${errorBody.slice(0, 200)}`;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI returned an empty response. Please try again.");
  }

  // Parse JSON from AI response
  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
  }

  const rawContacts = Array.isArray(parsed.contacts)
    ? parsed.contacts
    : Array.isArray(parsed)
      ? parsed
      : [parsed];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contacts: ParsedContact[] = rawContacts.map((c: any) => ({
    ...EMPTY_CONTACT,
    firstName: typeof c.firstName === "string" ? c.firstName : "",
    lastName: typeof c.lastName === "string" ? c.lastName : "",
    email: typeof c.email === "string" ? c.email : "",
    phone: typeof c.phone === "string" ? c.phone : "",
    additionalEmail: typeof c.additionalEmail === "string" ? c.additionalEmail : "",
    additionalPhone: typeof c.additionalPhone === "string" ? c.additionalPhone : "",
    company: typeof c.company === "string" ? c.company : "",
    jobTitle: typeof c.jobTitle === "string" ? c.jobTitle : "",
    address: typeof c.address === "string" ? c.address : "",
    city: typeof c.city === "string" ? c.city : "",
    state: typeof c.state === "string" ? c.state : "",
    zip: typeof c.zip === "string" ? c.zip : "",
    website: typeof c.website === "string" ? c.website : "",
    source: typeof c.source === "string" ? c.source : "",
    tags: typeof c.tags === "string" ? c.tags : "",
    opportunityName: typeof c.opportunityName === "string" ? c.opportunityName : "",
    pipeline: typeof c.pipeline === "string" ? c.pipeline : "",
    stage: typeof c.stage === "string" ? c.stage : "",
    opportunityValue: typeof c.opportunityValue === "string" ? c.opportunityValue : "",
    status: typeof c.status === "string" ? c.status : "",
    lostReason: typeof c.lostReason === "string" ? c.lostReason : "",
    notes: Array.isArray(c.notes) ? c.notes : [],
    confidence: c.confidence && typeof c.confidence === "object" ? c.confidence : {},
    suggestedTags: Array.isArray(c.suggestedTags) ? c.suggestedTags : [],
    detectedSource: typeof c.detectedSource === "string" ? c.detectedSource : "",
  }));

  return {
    contacts,
    modelUsed: "gpt-4o",
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}
