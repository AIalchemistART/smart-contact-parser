"use client";

import { useState, useCallback, useRef } from "react";
import { ParsedContact, Preference } from "@/lib/types";
import { getApiKey } from "@/lib/storage";
import { ParseInput } from "@/components/parse-input";
import { ResultsPanel } from "@/components/results-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Settings, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LastInput {
  text: string;
  images: { data: string; mimeType: string }[];
  userInstructions: string;
  batchMode: boolean;
}

export default function ToolPage() {
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [parsing, setParsing] = useState(false);
  const [rescanning, setRescanning] = useState(false);
  const [error, setError] = useState("");
  const [totalTokens, setTotalTokens] = useState(0);
  const lastInputRef = useRef<LastInput | null>(null);

  const handlePreferencesChange = useCallback((prefs: Preference[]) => {
    setPreferences(prefs);
  }, []);

  const handleParse = async (input: {
    text: string;
    images: { data: string; mimeType: string }[];
    userInstructions: string;
    batchMode: boolean;
  }) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError("Please set your OpenAI API key in the Settings tab first.");
      return;
    }

    setParsing(true);
    setError("");

    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input.text || undefined,
          images: input.images.length > 0 ? input.images : undefined,
          userInstructions: input.userInstructions || undefined,
          preferences,
          apiKey,
          batchMode: input.batchMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Parsing failed");
        return;
      }

      if (data.contacts && data.contacts.length > 0) {
        setContacts((prev) => [...prev, ...data.contacts]);
        setTotalTokens((prev) => prev + (data.usage?.totalTokens || 0));
        lastInputRef.current = input;
      } else {
        setError("No contacts found in the input.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setParsing(false);
    }
  };

  const handleFindMore = async () => {
    const apiKey = getApiKey();
    const input = lastInputRef.current;
    if (!apiKey || !input) return;

    setRescanning(true);
    setError("");

    try {
      const alreadyFound = contacts.map((c) => ({
        firstName: c.firstName,
        lastName: c.lastName,
        company: c.company,
      }));

      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input.text || undefined,
          images: input.images.length > 0 ? input.images : undefined,
          userInstructions: input.userInstructions || undefined,
          preferences,
          apiKey,
          batchMode: true,
          alreadyFound,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Re-scan failed");
        return;
      }

      if (data.contacts && data.contacts.length > 0) {
        setContacts((prev) => [...prev, ...data.contacts]);
        setTotalTokens((prev) => prev + (data.usage?.totalTokens || 0));
      } else {
        setError("No additional contacts found. All contacts may have been captured.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setRescanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="font-semibold text-lg">Smart Contact Parser</h1>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {contacts.length > 0 && (
              <span>{contacts.length} contact{contacts.length !== 1 ? "s" : ""} parsed</span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input */}
          <div>
            <Tabs defaultValue="parse">
              <TabsList className="w-full">
                <TabsTrigger value="parse" className="flex-1 gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Parse
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 gap-1.5">
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="parse" className="mt-4">
                <ParseInput onParse={handleParse} parsing={parsing} error={error} />
              </TabsContent>
              <TabsContent value="settings" className="mt-4">
                <SettingsPanel onPreferencesChange={handlePreferencesChange} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Results */}
          <div>
            <ResultsPanel
              contacts={contacts}
              onUpdateContact={(i, updated) => {
                setContacts((prev) => prev.map((c, idx) => (idx === i ? updated : c)));
              }}
              onRemoveContact={(i) => {
                setContacts((prev) => prev.filter((_, idx) => idx !== i));
              }}
              onClearAll={() => {
                setContacts([]);
                setTotalTokens(0);
                lastInputRef.current = null;
              }}
              totalTokens={totalTokens}
              onFindMore={handleFindMore}
              canFindMore={!!lastInputRef.current && contacts.length > 0}
              findingMore={rescanning}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
