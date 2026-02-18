"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  FileText, X, Play, Pause, Square, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, AlertCircle, Upload,
} from "lucide-react";

const CHUNK_PRESETS = [
  { label: "Small — 4K", value: 4000 },
  { label: "Medium — 8K", value: 8000 },
  { label: "Large — 12K", value: 12000 },
] as const;

function smartChunk(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  let pos = 0;
  while (pos < text.length) {
    let end = Math.min(pos + chunkSize, text.length);
    if (end < text.length) {
      const lookback = Math.max(end - 600, pos + 200);
      const lastDoubleBreak = text.lastIndexOf("\n\n", end);
      if (lastDoubleBreak > lookback) {
        end = lastDoubleBreak + 2;
      } else {
        const lastNewline = text.lastIndexOf("\n", end);
        if (lastNewline > lookback) end = lastNewline + 1;
      }
    }
    const chunk = text.slice(pos, end).trim();
    if (chunk.length > 0) chunks.push(chunk);
    pos = end;
  }
  return chunks;
}

export interface BatchProgress {
  current: number;
  total: number;
  contactsFound: number;
  running: boolean;
  paused: boolean;
  done: boolean;
  errorCount: number;
}

interface FileBatchPanelProps {
  onStartBatch: (chunks: string[], userInstructions: string) => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  batchProgress: BatchProgress | null;
  error: string;
}

export function FileBatchPanel({
  onStartBatch, onPause, onResume, onCancel, batchProgress, error,
}: FileBatchPanelProps) {
  const [rawText, setRawText] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [chunkSize, setChunkSize] = useState(8000);
  const [dragging, setDragging] = useState(false);
  const [userInstructions, setUserInstructions] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chunks = rawText ? smartChunk(rawText, chunkSize) : [];

  const loadFile = (f: File) => {
    if (!f.name.match(/\.(txt|md|csv|tsv)$/i)) {
      alert("Please upload a .txt, .md, .csv, or .tsv file.\nFor Word documents: File → Save As → Plain Text (.txt).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRawText(reader.result as string);
      setFileName(f.name);
    };
    reader.readAsText(f, "utf-8");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) loadFile(f);
    e.target.value = "";
  };

  const clearFile = () => {
    setRawText(null);
    setFileName("");
    onCancel();
  };

  // ── Progress view ────────────────────────────────────────────────────────────
  if (batchProgress) {
    const pct = batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {batchProgress.done ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : batchProgress.paused ? (
              <Pause className="h-4 w-4 text-amber-500" />
            ) : (
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            )}
            <span className="text-sm font-medium">
              {batchProgress.done
                ? "Processing complete"
                : batchProgress.paused
                  ? "Paused"
                  : `Processing chunk ${batchProgress.current} of ${batchProgress.total}…`}
            </span>
          </div>
          {!batchProgress.done && (
            <div className="flex gap-1.5">
              {batchProgress.paused ? (
                <Button size="sm" variant="outline" onClick={onResume} className="h-7 text-xs gap-1.5">
                  <Play className="h-3 w-3" /> Resume
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={onPause} className="h-7 text-xs gap-1.5">
                  <Pause className="h-3 w-3" /> Pause
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={clearFile}
                className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive">
                <Square className="h-3 w-3" /> Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{batchProgress.current} / {batchProgress.total} chunks</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${batchProgress.done ? "bg-emerald-500" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{batchProgress.contactsFound}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Contacts found</p>
          </div>
          <div className="rounded-lg bg-muted/50 border p-3 text-center">
            <p className="text-2xl font-bold">{batchProgress.total - batchProgress.current}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Chunks remaining</p>
          </div>
        </div>

        {batchProgress.errorCount > 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {batchProgress.errorCount} chunk{batchProgress.errorCount !== 1 ? "s" : ""} had errors and were skipped
          </div>
        )}

        {batchProgress.done && (
          <Button variant="outline" size="sm" className="w-full" onClick={clearFile}>
            Process Another File
          </Button>
        )}

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // ── File drop zone ───────────────────────────────────────────────────────────
  if (!rawText) {
    return (
      <div className="space-y-3">
        <div className="text-xs bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-primary leading-relaxed">
          <strong>For large documents:</strong> Drop a .txt file and the tool will auto-chunk it and
          process every section with AI — no copy-pasting required.
        </div>

        <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.tsv" className="hidden" onChange={handleFileInput} />

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/20"
          }`}
        >
          <Upload className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm font-medium">Drop a text file here</p>
          <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
          <p className="text-[10px] text-muted-foreground mt-3">.txt &nbsp;·&nbsp; .md &nbsp;·&nbsp; .csv &nbsp;·&nbsp; .tsv</p>
          <p className="text-[10px] text-muted-foreground">Word doc? Save As → Plain Text (.txt)</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }

  // ── File loaded — configure + launch ────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
        <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {(rawText.length / 1000).toFixed(0)}K characters &nbsp;·&nbsp;
            <strong className="text-foreground">{chunks.length} chunks</strong> at {chunkSize / 1000}K each
          </p>
        </div>
        <button className="text-muted-foreground hover:text-foreground shrink-0" onClick={clearFile}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">Chunk size</p>
        <div className="flex gap-1.5">
          {CHUNK_PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setChunkSize(preset.value)}
              className={`flex-1 rounded-md border py-1.5 text-xs transition-colors ${
                chunkSize === preset.value
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "border-border hover:border-primary/30 text-muted-foreground"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground">
          Larger chunks = more contacts per API call but higher risk of hitting token limits.
        </p>
      </div>

      <button
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setShowInstructions(!showInstructions)}
      >
        {showInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Special instructions for all chunks
      </button>
      {showInstructions && (
        <textarea
          value={userInstructions}
          onChange={(e) => setUserInstructions(e.target.value)}
          placeholder={"Applied to every chunk. Examples:\n- \"Uses ==== as section breaks\"\n- \"Extract every person, even with minimal info\"\n- \"Ignore page headers and LLC filing data\""}
          rows={4}
          className="w-full rounded-md border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
        />
      )}

      <Button
        className="w-full"
        size="lg"
        onClick={() => onStartBatch(chunks, userInstructions)}
      >
        <Play className="mr-2 h-4 w-4" />
        Start — Process {chunks.length} Chunks
      </Button>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
