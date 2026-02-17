"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  EyeOff,
  CheckCircle2,
  Wand2,
} from "lucide-react";
import { getApiKey, setApiKey, getPreferences, setPreferences } from "@/lib/storage";
import { Preference } from "@/lib/types";

const RECOMMENDED_RULES: string[] = [
  "SECTION BREAKS: Lines of equal signs (====) denote major breaks — a new industry, specialization, or company profile. Lines of dashes (----) or underscores (____) denote sub-breaks between individual contacts WITHIN the same company. Both patterns signal a new contact entry.",
  "MULTIPLE CONTACTS PER COMPANY: A single company block (between ==== breaks) can contain MULTIPLE people. Each person separated by ---- or ------ is a distinct contact. Extract ALL of them, even if they only have a name and role with no phone/email.",
  "CONTACT BLOCKS: Structured contact data typically appears as: Name on its own line, then Title/Role, then Mobile/Phone number, then Email. Look for this pattern even when the formatting is loose. Google review lines, addresses, and phone numbers near a company name indicate a business listing — extract the people listed below it.",
  "NOTES BELONG TO NEAREST CONTACT: Date-prefixed entries (like '01 15 2026' or '12 19 2025' in MM DD YYYY format) are notes/journal entries. They belong to the contact whose structured info block is nearest (usually directly below the notes). NEVER create a new contact from names mentioned inside notes text.",
  "PARTIAL CONTACTS ARE VALID: Extract contacts even with incomplete data. A person with just a name + email is valid. A person with just a name + role (like 'Co-Owner') is valid. Use empty strings for unknown fields. Phone numbers shown as '??? ??? ????' should be left empty.",
  "IGNORE NON-CONTACT DATA: LLC filing information, business registration details, certificate requests, filing types, status fields, AR due dates, and registered agent info are NOT contact data — skip these entirely.",
  "NOTES AGGREGATION: All notes for a contact should be captured as separate note entries with dates. Include meeting notes, call logs, follow-up items, relationship context, and membership details. Preserve chronological order. These will be merged into one cell on CSV export.",
  "ABANDONED/INACTIVE MARKERS: Text like 'ABANDON' or status notes about a contact not being a fit should go into that contact's notes, not prevent extraction. The contact still gets created.",
  "COMPANY NAME MAPPING: The company name from the Google listing or heading (e.g., 'Mighty Dog Roofing of Southwest Idaho', 'Hawaiian Built Roofing') should be applied to ALL contacts found within that ==== section block as their company/Business Name.",
];

interface SettingsPanelProps {
  onPreferencesChange: (prefs: Preference[]) => void;
}

export function SettingsPanel({ onPreferencesChange }: SettingsPanelProps) {
  const [key, setKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preferences, setPrefs] = useState<Preference[]>([]);
  const [newRule, setNewRule] = useState("");

  useEffect(() => {
    setKey(getApiKey());
    const p = getPreferences();
    setPrefs(p);
    onPreferencesChange(p);
  }, [onPreferencesChange]);

  const handleSaveKey = () => {
    setApiKey(key);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    const pref: Preference = {
      id: crypto.randomUUID(),
      rule: newRule.trim(),
      active: true,
    };
    const updated = [pref, ...preferences];
    setPrefs(updated);
    setPreferences(updated);
    onPreferencesChange(updated);
    setNewRule("");
  };

  const toggleRule = (id: string) => {
    const updated = preferences.map((p) =>
      p.id === id ? { ...p, active: !p.active } : p
    );
    setPrefs(updated);
    setPreferences(updated);
    onPreferencesChange(updated);
  };

  const deleteRule = (id: string) => {
    const updated = preferences.filter((p) => p.id !== id);
    setPrefs(updated);
    setPreferences(updated);
    onPreferencesChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* API Key */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Key className="h-4 w-4" />
          OpenAI API Key
        </Label>
        <p className="text-xs text-muted-foreground">
          Your key is stored locally in your browser and never sent to our servers.
          It is only used for direct OpenAI API calls.
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={showKey ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-..."
              className="pr-10"
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey(!showKey)}
              type="button"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button onClick={handleSaveKey} disabled={!key.trim()}>
            {saved ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Saved
              </>
            ) : (
              "Save Key"
            )}
          </Button>
        </div>
      </div>

      {/* Parsing Rules */}
      <div className="space-y-3">
        <Label className="text-sm font-medium flex items-center gap-2">
          Parsing Rules
          {preferences.filter((p) => p.active).length > 0 && (
            <Badge variant="secondary" className="text-[10px]">
              {preferences.filter((p) => p.active).length} active
            </Badge>
          )}
        </Label>
        <p className="text-xs text-muted-foreground">
          Rules that teach the AI how you prefer contacts parsed. These are included
          in every parse request as additional instructions.
        </p>
        {preferences.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            className="w-full border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => {
              const recommended: Preference[] = RECOMMENDED_RULES.map((rule) => ({
                id: crypto.randomUUID(),
                rule,
                active: true,
              }));
              const updated = [...recommended, ...preferences];
              setPrefs(updated);
              setPreferences(updated);
              onPreferencesChange(updated);
            }}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            Load Recommended Rules (Word Doc / CRM notes format)
          </Button>
        )}
        <div className="flex gap-2">
          <Input
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            placeholder='e.g., "Always put secondary phone numbers in notes"'
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && addRule()}
          />
          <Button onClick={addRule} disabled={!newRule.trim()} size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {preferences.length > 0 && (
          <div className="space-y-1 max-h-64 overflow-y-auto rounded-lg border p-2">
            {preferences.map((pref) => (
              <div
                key={pref.id}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
                  pref.active ? "bg-muted/50" : "opacity-40"
                }`}
              >
                <span className="flex-1">{pref.rule}</span>
                <button
                  onClick={() => toggleRule(pref.id)}
                  className="shrink-0"
                  title={pref.active ? "Disable" : "Enable"}
                >
                  {pref.active ? (
                    <ToggleRight className="h-5 w-5 text-primary" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={() => deleteRule(pref.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
