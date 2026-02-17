export interface ParsedContact {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  additionalEmail: string;
  additionalPhone: string;
  company: string;
  jobTitle: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  source: string;
  tags: string;
  // GHL opportunity fields (inferred from context)
  opportunityName: string;
  pipeline: string;
  stage: string;
  opportunityValue: string;
  status: string;
  lostReason: string;
  notes: { content: string; date: string }[];
  confidence: Record<string, string>;
  suggestedTags: string[];
  detectedSource: string;
}

export interface Preference {
  id: string;
  rule: string;
  active: boolean;
}

export interface BatchResult {
  id: string;
  pageLabel: string;
  contacts: ParsedContact[];
  status: "pending" | "parsing" | "done" | "error";
  error?: string;
  tokensUsed: number;
}

export const EMPTY_CONTACT: ParsedContact = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  additionalEmail: "",
  additionalPhone: "",
  company: "",
  jobTitle: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  website: "",
  source: "",
  tags: "",
  opportunityName: "",
  pipeline: "",
  stage: "",
  opportunityValue: "",
  status: "",
  lostReason: "",
  notes: [],
  confidence: {},
  suggestedTags: [],
  detectedSource: "",
};

// Official GoHighLevel CSV import columns
export const GHL_COLUMNS = [
  "Contact ID",
  "Phone",
  "Email",
  "First Name",
  "Last Name",
  "Business Name",
  "Opportunity ID",
  "Opportunity name",
  "Pipeline",
  "Stage",
  "Opportunity Value",
  "Source",
  "Opportunity Owner",
  "Opportunity Followers",
  "Status",
  "Lost Reason",
  "Additional Email",
  "Additional Phone",
  "Notes",
  "Tags",
] as const;

// Aggregate all notes into a single string for GHL import (GHL only supports one note per contact)
export function aggregateNotes(c: ParsedContact): string {
  const parts: string[] = [];

  // Fold extra fields that GHL doesn't have columns for
  if (c.jobTitle) parts.push(`Job Title: ${c.jobTitle}`);
  const fullAddr = [c.address, c.city, c.state, c.zip].filter(Boolean).join(", ");
  if (fullAddr) parts.push(`Address: ${fullAddr}`);
  if (c.website) parts.push(`Website: ${c.website}`);

  // Aggregate all note entries into one
  for (const n of c.notes) {
    if (!n.content) continue;
    const prefix = n.date ? `[${n.date}] ` : "";
    parts.push(prefix + n.content);
  }

  return parts.join(" | ");
}

export function contactToGhlRow(c: ParsedContact): string[] {
  return [
    "",                    // Contact ID (blank for new imports)
    c.phone,
    c.email,
    c.firstName,
    c.lastName,
    c.company,             // Business Name
    "",                    // Opportunity ID
    c.opportunityName,
    c.pipeline,
    c.stage,
    c.opportunityValue,
    c.source,
    "",                    // Opportunity Owner
    "",                    // Opportunity Followers
    c.status,
    c.lostReason,
    c.additionalEmail,
    c.additionalPhone,
    aggregateNotes(c),     // Single aggregated notes cell
    c.tags,
  ];
}

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function contactsToCsv(contacts: ParsedContact[]): string {
  const header = GHL_COLUMNS.map((c) => escapeCsvField(c)).join(",");
  const rows = contacts.map((c) =>
    contactToGhlRow(c)
      .map((f) => escapeCsvField(f))
      .join(",")
  );
  return [header, ...rows].join("\n");
}
