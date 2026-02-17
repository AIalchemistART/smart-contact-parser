import { Preference } from "./types";

const STORAGE_KEYS = {
  API_KEY: "scp_openai_key",
  PREFERENCES: "scp_preferences",
} as const;

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || "";
}

export function setApiKey(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.API_KEY, key);
}

export function getPreferences(): Preference[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setPreferences(prefs: Preference[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
}
