"use client";

import { useState } from "react";
import { ParsedContact, contactsToCsv } from "@/lib/types";
import { ContactCard } from "./contact-card";
import { ContactEditor } from "./contact-editor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Trash2,
  FileSpreadsheet,
  Users,
  SearchCheck,
  Loader2,
} from "lucide-react";

interface ResultsPanelProps {
  contacts: ParsedContact[];
  onUpdateContact: (index: number, contact: ParsedContact) => void;
  onRemoveContact: (index: number) => void;
  onClearAll: () => void;
  totalTokens: number;
  onFindMore?: () => void;
  canFindMore?: boolean;
  findingMore?: boolean;
}

export function ResultsPanel({
  contacts,
  onUpdateContact,
  onRemoveContact,
  onClearAll,
  totalTokens,
  onFindMore,
  canFindMore,
  findingMore,
}: ResultsPanelProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleExportCsv = () => {
    const csv = contactsToCsv(contacts);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center rounded-lg border border-dashed">
        <Users className="h-12 w-12 text-muted-foreground/20 mb-3" />
        <p className="text-sm text-muted-foreground">Parsed contacts appear here</p>
        <p className="text-xs text-muted-foreground mt-1">
          Paste text or upload images on the left, then click Parse
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Parsed Contacts</h2>
          <Badge variant="secondary">{contacts.length}</Badge>
          {totalTokens > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {totalTokens.toLocaleString()} tokens used
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            <FileSpreadsheet className="mr-1 h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onClearAll}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Find More */}
      {canFindMore && onFindMore && (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-primary/30 text-primary hover:bg-primary/10"
          onClick={onFindMore}
          disabled={findingMore}
        >
          {findingMore ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning for missed contacts...
            </>
          ) : (
            <>
              <SearchCheck className="mr-2 h-4 w-4" />
              Find More — Re-scan for missed contacts
            </>
          )}
        </Button>
      )}

      {/* GHL Note */}
      <div className="text-xs bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground">
        <strong>CSV Format:</strong> Official GoHighLevel import columns (Contact ID, Phone, Email,
        First Name, Last Name, Business Name, Source, Additional Email, Additional Phone, Notes, Tags, etc.).
        All notes are <strong>aggregated into a single cell</strong> per contact (GHL limitation).
        Job Title, Address, and Website are folded into Notes on export.
      </div>

      {/* Contact Cards */}
      <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
        {contacts.map((contact, i) => (
          <ContactCard
            key={i}
            contact={contact}
            index={i}
            onRemove={() => onRemoveContact(i)}
            onEdit={() => setEditingIndex(i)}
          />
        ))}
      </div>

      {/* Editor Dialog */}
      {editingIndex !== null && (
        <ContactEditor
          contact={contacts[editingIndex]}
          open={editingIndex !== null}
          onOpenChange={(open) => { if (!open) setEditingIndex(null); }}
          onSave={(updated) => {
            onUpdateContact(editingIndex, updated);
            setEditingIndex(null);
          }}
        />
      )}
    </div>
  );
}
