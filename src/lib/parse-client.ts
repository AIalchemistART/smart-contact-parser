import { ParsedContact, EMPTY_CONTACT } from "./types";
import { buildSystemPrompt, buildNotesEnrichmentPrompt } from "./prompt";

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

  // Build input parts for Responses API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inputParts: any[] = [];

  let userText = hasText ? text!.trim() : "";
  if (userInstructions && userInstructions.trim()) {
    userText += `\n\n---\nADDITIONAL USER INSTRUCTIONS:\n${userInstructions.trim()}`;
  }

  if (userText) {
    inputParts.push({ type: "input_text", text: userText });
  } else {
    inputParts.push({ type: "input_text", text: "Extract contact information from the attached image(s)." });
  }

  if (hasImages) {
    for (const img of images!) {
      inputParts.push({
        type: "input_image",
        image_url: `data:${img.mimeType};base64,${img.data}`,
        detail: "high",
      });
    }
  }

  // Try gpt-5.1-codex-mini via Responses API, fall back to gpt-4o via Chat Completions
  let content: string | null = null;
  let modelUsed = "gpt-5.1-codex-mini";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let usageRaw: any = null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.1-codex-mini",
        instructions: systemPrompt,
        input: [{ role: "user", content: inputParts }],
        max_output_tokens: 40000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn("[parse] codex-mini failed:", response.status, errorBody?.slice(0, 200));
      throw new Error(`codex-mini ${response.status}`);
    }

    const data = await response.json();
    usageRaw = data.usage;

    if (data.status === "completed" && data.output_text) {
      content = data.output_text;
    } else {
      console.warn("[parse] codex-mini incomplete status:", data.status);
      throw new Error("incomplete_response");
    }
  } catch (primaryErr) {
    // Fallback to gpt-4o via Chat Completions API
    console.log("[parse] Falling back to gpt-4o:", primaryErr instanceof Error ? primaryErr.message : "unknown");
    modelUsed = "gpt-4o";

    // Convert input parts to Chat Completions format
    type ChatPart =
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string; detail: "high" } };

    const chatParts: ChatPart[] = inputParts.map((p) => {
      if (p.type === "input_text") {
        return { type: "text" as const, text: p.text };
      }
      return {
        type: "image_url" as const,
        image_url: { url: p.image_url, detail: "high" as const },
      };
    });

    const fallbackRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
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

    if (!fallbackRes.ok) {
      const errorBody = await fallbackRes.text();
      let errorMsg = `OpenAI API error ${fallbackRes.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMsg = parsed.error?.message || errorMsg;
      } catch {
        if (errorBody) errorMsg += `: ${errorBody.slice(0, 200)}`;
      }
      throw new Error(errorMsg);
    }

    const fallbackData = await fallbackRes.json();
    content = fallbackData.choices?.[0]?.message?.content || null;
    usageRaw = fallbackData.usage;
  }

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

  const promptTokens = usageRaw?.input_tokens || usageRaw?.prompt_tokens || 0;
  const completionTokens = usageRaw?.output_tokens || usageRaw?.completion_tokens || 0;
  return {
    contacts,
    modelUsed,
    usage: {
      promptTokens,
      completionTokens,
      totalTokens: usageRaw?.total_tokens || promptTokens + completionTokens,
    },
  };
}

interface EnrichNotesOptions {
  contacts: ParsedContact[];
  originalText: string;
  apiKey: string;
}

interface EnrichNotesResult {
  updatedContacts: ParsedContact[];
  newNotesCount: number;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export async function enrichNotesClient(options: EnrichNotesOptions): Promise<EnrichNotesResult> {
  const { contacts, originalText, apiKey } = options;

  const enrichmentPrompt = buildNotesEnrichmentPrompt(
    contacts.map((c) => ({
      firstName: c.firstName,
      lastName: c.lastName,
      company: c.company,
      notes: Array.isArray(c.notes) ? c.notes : [],
    }))
  );

  let content: string | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let usageRaw: any = null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5.1-codex-mini",
        instructions: enrichmentPrompt,
        input: [{ role: "user", content: [{ type: "input_text", text: originalText }] }],
        max_output_tokens: 40000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn("[enrichNotes] codex-mini failed:", response.status, errorBody?.slice(0, 200));
      throw new Error(`codex-mini ${response.status}`);
    }

    const data = await response.json();
    usageRaw = data.usage;

    if (data.status === "completed" && data.output_text) {
      content = data.output_text;
    } else {
      throw new Error("incomplete_response");
    }
  } catch (primaryErr) {
    console.log("[enrichNotes] Falling back to gpt-4o:", primaryErr instanceof Error ? primaryErr.message : "unknown");

    const fallbackRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: enrichmentPrompt },
          { role: "user", content: originalText },
        ],
        max_tokens: 16000,
        temperature: 0.2,
      }),
    });

    if (!fallbackRes.ok) {
      const errorBody = await fallbackRes.text();
      let errorMsg = `OpenAI API error ${fallbackRes.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMsg = parsed.error?.message || errorMsg;
      } catch {
        if (errorBody) errorMsg += `: ${errorBody.slice(0, 200)}`;
      }
      throw new Error(errorMsg);
    }

    const fallbackData = await fallbackRes.json();
    content = fallbackData.choices?.[0]?.message?.content || null;
    usageRaw = fallbackData.usage;
  }

  if (!content) {
    throw new Error("AI returned an empty response. Please try again.");
  }

  const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI returned invalid JSON for notes enrichment. Please try again.");
  }

  const enrichedNotes: { contactIndex: number; newNotes: { content: string; date: string }[] }[] =
    Array.isArray(parsed.enrichedNotes) ? parsed.enrichedNotes : [];

  let newNotesCount = 0;
  const updatedContacts = contacts.map((contact, i) => {
    const enrichment = enrichedNotes.find((e) => e.contactIndex === i);
    if (!enrichment || !Array.isArray(enrichment.newNotes) || enrichment.newNotes.length === 0) {
      return contact;
    }

    const existingNoteTexts = new Set(
      (contact.notes || []).map((n) => n.content.toLowerCase().trim())
    );

    const trulyNew = enrichment.newNotes.filter(
      (n) => n.content && !existingNoteTexts.has(n.content.toLowerCase().trim())
    );

    if (trulyNew.length === 0) return contact;

    newNotesCount += trulyNew.length;
    return {
      ...contact,
      notes: [...(contact.notes || []), ...trulyNew],
    };
  });

  const enrichPromptTokens = usageRaw?.input_tokens || usageRaw?.prompt_tokens || 0;
  const enrichCompletionTokens = usageRaw?.output_tokens || usageRaw?.completion_tokens || 0;
  return {
    updatedContacts,
    newNotesCount,
    usage: {
      promptTokens: enrichPromptTokens,
      completionTokens: enrichCompletionTokens,
      totalTokens: usageRaw?.total_tokens || enrichPromptTokens + enrichCompletionTokens,
    },
  };
}
