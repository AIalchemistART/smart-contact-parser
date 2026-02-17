"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  X,
  ClipboardPaste,
  Layers,
} from "lucide-react";

interface AttachedImage {
  data: string;
  mimeType: string;
  name: string;
  preview: string;
}

interface ParseInputProps {
  onParse: (input: {
    text: string;
    images: { data: string; mimeType: string }[];
    userInstructions: string;
    batchMode: boolean;
  }) => Promise<void>;
  parsing: boolean;
  error: string;
}

export function ParseInput({ onParse, parsing, error }: ParseInputProps) {
  const [rawText, setRawText] = useState("");
  const [userInstructions, setUserInstructions] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > 20 * 1024 * 1024) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setAttachedImages((prev) => [
          ...prev,
          { data: base64, mimeType: file.type, name: file.name, preview: URL.createObjectURL(file) },
        ]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const text = e.dataTransfer.getData("text/plain");
    if (text) { setRawText(text); return; }
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 20 * 1024 * 1024) continue;
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(",")[1];
          setAttachedImages((prev) => [
            ...prev,
            { data: base64, mimeType: file.type, name: file.name, preview: URL.createObjectURL(file) },
          ]);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async () => {
    await onParse({
      text: rawText,
      images: attachedImages.map((img) => ({ data: img.data, mimeType: img.mimeType })),
      userInstructions,
      batchMode,
    });
  };

  const hasInput = rawText.trim().length > 0 || attachedImages.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium flex items-center gap-2">
          <ClipboardPaste className="h-4 w-4" />
          Paste Contact Info
        </Label>
        <button
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
            batchMode
              ? "bg-primary/10 border-primary/30 text-primary"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setBatchMode(!batchMode)}
        >
          <Layers className="h-3 w-3" />
          {batchMode ? "Batch Mode ON" : "Batch Mode"}
        </button>
      </div>

      {batchMode && (
        <div className="text-xs bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 text-primary">
          <strong>Batch Mode:</strong> Paste a page of text containing multiple contacts.
          The AI will extract all contacts it finds. Great for processing Word document pages.
        </div>
      )}

      <div onDrop={handleFileDrop} onDragOver={(e) => e.preventDefault()}>
        <Textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={batchMode
            ? "Paste a page (or several pages) from your Word document here...\n\nThe AI will extract all contacts found in the text.\n\nTip: Start with 10 pages to dial in your special instructions,\nthen run the full document."
            : "Paste one contact's info here...\n\nExample:\nJohn Smith\nVP of Sales at Acme Corp\njohn@acme.com | (555) 123-4567\nMet at the networking luncheon.\n\nOr drag & drop a business card / note image."
          }
          rows={attachedImages.length > 0 ? 8 : 12}
          className="resize-none text-sm font-mono"
        />
      </div>

      {/* Image upload */}
      <div className="space-y-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Attach Image (Business Card, Notes, Screenshot)
        </Button>

        {attachedImages.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {attachedImages.map((img, i) => (
              <div key={i} className="relative group">
                <img src={img.preview} alt={img.name} className="h-20 w-20 object-cover rounded-lg border" />
                <button
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(i)}
                >
                  <X className="h-3 w-3" />
                </button>
                <p className="text-[9px] text-muted-foreground truncate w-20 mt-0.5">{img.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Special Instructions */}
      <button
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setShowInstructions(!showInstructions)}
      >
        {showInstructions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Special instructions for this parse
      </button>
      {showInstructions && (
        <Textarea
          value={userInstructions}
          onChange={(e) => setUserInstructions(e.target.value)}
          placeholder={`Per-parse instructions (examples for Word doc CRM notes):

- "This document uses ==== as major section breaks and ---- as sub-contact separators within the same company"
- "Extract every person listed, even with partial info (just name + role is fine)"
- "Date entries like '01 15 2026' are notes — attach them to the nearest contact block, not as new contacts"
- "Ignore LLC filing data, registration info, and certificate requests"
- "Multiple people can belong to the same company — extract each one separately"`}
          rows={5}
          className="resize-none text-xs"
        />
      )}

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!hasInput || parsing}
        className="w-full"
        size="lg"
      >
        {parsing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Parsing{attachedImages.length > 0 ? " (vision)" : ""}...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Parse with AI
            {batchMode ? " (Batch)" : ""}
            {attachedImages.length > 0 ? ` + ${attachedImages.length} image${attachedImages.length > 1 ? "s" : ""}` : ""}
          </>
        )}
      </Button>
    </div>
  );
}
