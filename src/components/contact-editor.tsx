"use client";

import { useState } from "react";
import { ParsedContact } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Save, Plus, Trash2 } from "lucide-react";

interface ContactEditorProps {
  contact: ParsedContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (contact: ParsedContact) => void;
}

export function ContactEditor({ contact, open, onOpenChange, onSave }: ContactEditorProps) {
  const [form, setForm] = useState<ParsedContact>({ ...contact });

  const update = (field: keyof ParsedContact, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Contact</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">First Name *</Label>
              <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Last Name</Label>
              <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Additional Email</Label>
              <Input type="email" value={form.additionalEmail} onChange={(e) => update("additionalEmail", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Additional Phone</Label>
              <Input value={form.additionalPhone} onChange={(e) => update("additionalPhone", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Company / Business Name</Label>
              <Input value={form.company} onChange={(e) => update("company", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Job Title</Label>
              <Input value={form.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Website</Label>
            <Input value={form.website} onChange={(e) => update("website", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Address</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">City</Label>
              <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">State</Label>
              <Input value={form.state} onChange={(e) => update("state", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zip</Label>
              <Input value={form.zip} onChange={(e) => update("zip", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Source</Label>
              <Input value={form.source} onChange={(e) => update("source", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tags</Label>
              <Input value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="tag1, tag2" />
            </div>
          </div>

          {/* Opportunity Fields */}
          <div className="space-y-3 rounded border border-primary/20 bg-primary/5 p-3">
            <Label className="text-xs font-medium text-primary">GHL Opportunity (inferred from context)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Opportunity Name</Label>
                <Input value={form.opportunityName} onChange={(e) => update("opportunityName", e.target.value)} placeholder="e.g., Company - NIA Membership" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pipeline</Label>
                <Input value={form.pipeline} onChange={(e) => update("pipeline", e.target.value)} placeholder="e.g., NIA Membership" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Stage</Label>
                <Input value={form.stage} onChange={(e) => update("stage", e.target.value)} placeholder="e.g., Won, Prospect, Lost" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Input value={form.status} onChange={(e) => update("status", e.target.value)} placeholder="open, won, lost" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Opportunity Value</Label>
                <Input value={form.opportunityValue} onChange={(e) => update("opportunityValue", e.target.value)} placeholder="e.g., $165" />
              </div>
            </div>
            {(form.status === "lost" || form.status === "abandoned") && (
              <div className="space-y-1">
                <Label className="text-xs">Lost Reason</Label>
                <Input value={form.lostReason} onChange={(e) => update("lostReason", e.target.value)} />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Notes ({form.notes.length})</Label>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    notes: [...prev.notes, { content: "", date: "" }],
                  }))
                }
              >
                <Plus className="mr-1 h-3 w-3" /> Add Note
              </Button>
            </div>
            {form.notes.map((note, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <Textarea
                    value={note.content}
                    onChange={(e) => {
                      const updated = [...form.notes];
                      updated[i] = { ...updated[i], content: e.target.value };
                      setForm((prev) => ({ ...prev, notes: updated }));
                    }}
                    rows={2}
                    className="text-sm resize-none"
                  />
                  <Input
                    type="date"
                    value={note.date}
                    onChange={(e) => {
                      const updated = [...form.notes];
                      updated[i] = { ...updated[i], date: e.target.value };
                      setForm((prev) => ({ ...prev, notes: updated }));
                    }}
                    className="h-7 text-xs w-36"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      notes: prev.notes.filter((_, j) => j !== i),
                    }))
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
