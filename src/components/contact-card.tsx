"use client";

import { ParsedContact } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Building2,
  Mail,
  Phone,
  Smartphone,
  Globe,
  MapPin,
  StickyNote,
  Tag,
  Trash2,
  Edit3,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  TrendingUp,
} from "lucide-react";

function ConfidenceDot({ level }: { level?: string }) {
  if (!level) return null;
  const cfg: Record<string, { color: string; Icon: typeof ShieldCheck }> = {
    high: { color: "text-green-500", Icon: ShieldCheck },
    medium: { color: "text-amber-500", Icon: ShieldQuestion },
    low: { color: "text-red-500", Icon: ShieldAlert },
  };
  const c = cfg[level];
  if (!c) return null;
  return <c.Icon className={`h-3 w-3 ${c.color} shrink-0`} />;
}

function Field({
  icon: Icon,
  label,
  value,
  confidence,
}: {
  icon: typeof User;
  label: string;
  value: string;
  confidence?: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div className="min-w-0">
        <span className="text-muted-foreground text-xs">{label}</span>
        <p className="break-words flex items-center gap-1">
          {value}
          <ConfidenceDot level={confidence} />
        </p>
      </div>
    </div>
  );
}

interface ContactCardProps {
  contact: ParsedContact;
  index: number;
  onRemove: () => void;
  onEdit: () => void;
}

export function ContactCard({ contact, index, onRemove, onEdit }: ContactCardProps) {
  const c = contact;
  const fullName = [c.firstName, c.lastName].filter(Boolean).join(" ") || "Unknown";
  const fullAddress = [c.address, c.city, c.state, c.zip].filter(Boolean).join(", ");

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 relative group">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {fullName}
            <span className="text-xs text-muted-foreground font-normal">#{index + 1}</span>
          </h3>
          {c.jobTitle && c.company && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {c.jobTitle} at {c.company}
            </p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={onRemove}
            title="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {!c.jobTitle && <Field icon={Building2} label="Company" value={c.company} confidence={c.confidence.company} />}
        {c.jobTitle && !c.company && <Field icon={Building2} label="Title" value={c.jobTitle} confidence={c.confidence.jobTitle} />}
        <Field icon={Mail} label="Email" value={c.email} confidence={c.confidence.email} />
        <Field icon={Phone} label="Phone" value={c.phone} confidence={c.confidence.phone} />
        <Field icon={Mail} label="Additional Email" value={c.additionalEmail} confidence={c.confidence.additionalEmail} />
        <Field icon={Smartphone} label="Additional Phone" value={c.additionalPhone} confidence={c.confidence.additionalPhone} />
        <Field icon={Globe} label="Website" value={c.website} confidence={c.confidence.website} />
        {fullAddress && <Field icon={MapPin} label="Address" value={fullAddress} confidence={c.confidence.address} />}
      </div>

      {/* Opportunity fields */}
      {(c.pipeline || c.stage || c.status || c.opportunityValue) && (
        <div className="rounded border border-primary/20 bg-primary/5 px-3 py-2 space-y-1">
          <div className="flex items-center gap-1 text-xs font-medium text-primary">
            <TrendingUp className="h-3 w-3" />
            Opportunity
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
            {c.opportunityName && (
              <div className="col-span-2"><span className="text-muted-foreground">Name:</span> {c.opportunityName}</div>
            )}
            {c.pipeline && <div><span className="text-muted-foreground">Pipeline:</span> {c.pipeline}</div>}
            {c.stage && <div><span className="text-muted-foreground">Stage:</span> {c.stage}</div>}
            {c.status && (
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className={c.status === "won" ? "text-green-500 font-medium" : c.status === "lost" || c.status === "abandoned" ? "text-red-400 font-medium" : "text-amber-400"}>
                  {c.status}
                </span>
              </div>
            )}
            {c.opportunityValue && <div><span className="text-muted-foreground">Value:</span> {c.opportunityValue}</div>}
            {c.lostReason && (
              <div className="col-span-2"><span className="text-muted-foreground">Lost Reason:</span> {c.lostReason}</div>
            )}
          </div>
        </div>
      )}

      {c.notes.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <StickyNote className="h-3 w-3" />
            {c.notes.length} note{c.notes.length !== 1 ? "s" : ""}
          </div>
          {c.notes.map((note, i) => (
            <p key={i} className="text-xs bg-muted/50 rounded px-2 py-1">
              {note.date && <span className="text-muted-foreground">[{note.date}] </span>}
              {note.content}
            </p>
          ))}
        </div>
      )}

      {(c.tags || c.suggestedTags.length > 0) && (
        <div className="flex flex-wrap gap-1">
          <Tag className="h-3 w-3 text-muted-foreground mt-0.5" />
          {c.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[10px]">
                {tag}
              </Badge>
            ))}
        </div>
      )}

      {c.detectedSource && (
        <Badge variant="outline" className="text-[10px]">
          Source: {c.detectedSource.replace(/_/g, " ")}
        </Badge>
      )}
    </div>
  );
}
