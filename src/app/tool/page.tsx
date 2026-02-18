"use client";

import { useState, useCallback, useRef } from "react";
import { ParsedContact, Preference } from "@/lib/types";
import { getApiKey } from "@/lib/storage";
import { parseContactsClient, enrichNotesClient } from "@/lib/parse-client";
import { ParseInput } from "@/components/parse-input";
import { ResultsPanel } from "@/components/results-panel";
import { SettingsPanel } from "@/components/settings-panel";
import { FileBatchPanel, type BatchProgress } from "@/components/file-batch-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Settings, ArrowLeft, FolderOpen } from "lucide-react";
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
  const [enrichingNotes, setEnrichingNotes] = useState(false);
  const [error, setError] = useState("");
  const [totalTokens, setTotalTokens] = useState(0);
  const lastInputRef = useRef<LastInput | null>(null);

  // File-batch state
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
  const [batchError, setBatchError] = useState("");
  const batchControlRef = useRef({ paused: false, cancelled: false });

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
      const result = await parseContactsClient({
        text: input.text || undefined,
        images: input.images.length > 0 ? input.images : undefined,
        userInstructions: input.userInstructions || undefined,
        preferences,
        apiKey,
        batchMode: input.batchMode,
      });

      if (result.contacts.length > 0) {
        setContacts((prev) => [...prev, ...result.contacts]);
        setTotalTokens((prev) => prev + (result.usage?.totalTokens || 0));
        lastInputRef.current = input;
      } else {
        setError("No contacts found in the input.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Parsing failed");
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

      const result = await parseContactsClient({
        text: input.text || undefined,
        images: input.images.length > 0 ? input.images : undefined,
        userInstructions: input.userInstructions || undefined,
        preferences,
        apiKey,
        batchMode: true,
        alreadyFound,
      });

      if (result.contacts.length > 0) {
        setContacts((prev) => [...prev, ...result.contacts]);
        setTotalTokens((prev) => prev + (result.usage?.totalTokens || 0));
      } else {
        setError("No additional contacts found. All contacts may have been captured.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Re-scan failed");
    } finally {
      setRescanning(false);
    }
  };

  const handleFindMissingNotes = async () => {
    const apiKey = getApiKey();
    const input = lastInputRef.current;
    if (!apiKey || !input || contacts.length === 0) return;

    setEnrichingNotes(true);
    setError("");

    try {
      const result = await enrichNotesClient({
        contacts,
        originalText: input.text || "",
        apiKey,
      });

      if (result.newNotesCount > 0) {
        setContacts(result.updatedContacts);
        setTotalTokens((prev) => prev + (result.usage?.totalTokens || 0));
        setError(`Found ${result.newNotesCount} new note${result.newNotesCount !== 1 ? "s" : ""} across contacts.`);
      } else {
        setError("No missing notes found. Notes appear to be complete.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Notes enrichment failed");
    } finally {
      setEnrichingNotes(false);
    }
  };

  // ── File batch processing ──────────────────────────────────────────────────
  const handleStartBatch = useCallback(async (chunks: string[], userInstructions: string) => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setBatchError("Please set your OpenAI API key in the Settings tab first.");
      return;
    }

    batchControlRef.current = { paused: false, cancelled: false };
    setBatchError("");
    setBatchProgress({
      current: 0,
      total: chunks.length,
      contactsFound: 0,
      running: true,
      paused: false,
      done: false,
      errorCount: 0,
    });

    let totalFound = 0;
    let errorCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      // Pause loop
      while (batchControlRef.current.paused) {
        await new Promise((r) => setTimeout(r, 300));
      }
      if (batchControlRef.current.cancelled) break;

      setBatchProgress((prev) =>
        prev ? { ...prev, current: i + 1, paused: false } : null
      );

      try {
        const result = await parseContactsClient({
          text: chunks[i],
          preferences,
          apiKey,
          batchMode: true,
          userInstructions: userInstructions || undefined,
        });

        if (result.contacts.length > 0) {
          totalFound += result.contacts.length;
          setContacts((prev) => [...prev, ...result.contacts]);
          setTotalTokens((prev) => prev + (result.usage?.totalTokens || 0));
          setBatchProgress((prev) =>
            prev ? { ...prev, contactsFound: totalFound } : null
          );
        }
      } catch (err) {
        console.error(`[Batch] Chunk ${i + 1} failed:`, err);
        errorCount++;
        setBatchProgress((prev) =>
          prev ? { ...prev, errorCount } : null
        );
      }

      // Rate-limit buffer between chunks
      if (i < chunks.length - 1 && !batchControlRef.current.cancelled) {
        await new Promise((r) => setTimeout(r, 900));
      }
    }

    setBatchProgress((prev) =>
      prev ? { ...prev, running: false, done: !batchControlRef.current.cancelled, errorCount } : null
    );
  }, [preferences]);

  const handleBatchPause = useCallback(() => {
    batchControlRef.current.paused = true;
    setBatchProgress((prev) => (prev ? { ...prev, paused: true } : null));
  }, []);

  const handleBatchResume = useCallback(() => {
    batchControlRef.current.paused = false;
    setBatchProgress((prev) => (prev ? { ...prev, paused: false } : null));
  }, []);

  const handleBatchCancel = useCallback(() => {
    batchControlRef.current.cancelled = true;
    batchControlRef.current.paused = false;
    setBatchProgress(null);
    setBatchError("");
  }, []);

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
                  Paste
                </TabsTrigger>
                <TabsTrigger value="file" className="flex-1 gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5" />
                  File Batch
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 gap-1.5">
                  <Settings className="h-3.5 w-3.5" />
                  Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="parse" className="mt-4">
                <ParseInput onParse={handleParse} parsing={parsing} error={error} />
              </TabsContent>
              <TabsContent value="file" className="mt-4">
                <FileBatchPanel
                  onStartBatch={handleStartBatch}
                  onPause={handleBatchPause}
                  onResume={handleBatchResume}
                  onCancel={handleBatchCancel}
                  batchProgress={batchProgress}
                  error={batchError}
                />
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
              onFindMissingNotes={handleFindMissingNotes}
              canFindMissingNotes={!!lastInputRef.current && contacts.length > 0}
              findingMissingNotes={enrichingNotes}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
