import Link from "next/link";
import {
  Sparkles,
  FileText,
  Image as ImageIcon,
  Download,
  Layers,
  Settings2,
  ArrowRight,
  CheckCircle2,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 relative">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered Contact Extraction
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl">
              Turn messy contact data into{" "}
              <span className="text-primary">structured records</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Paste unstructured text, upload business cards or handwritten notes, and let AI
              extract clean, structured contacts. Export to GoHighLevel-compatible CSV in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link
                href="/tool"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-8 py-3 text-base font-medium hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="h-5 w-5" />
                Start Parsing
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 border-t bg-muted/30">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Step
              num={1}
              icon={FileText}
              title="Paste or Upload"
              desc="Paste text from Word docs, emails, CRM exports, or drop business card / note images."
            />
            <Step
              num={2}
              icon={Sparkles}
              title="AI Extracts Contacts"
              desc="GPT-4o reads your input, identifies contacts, and structures every field with confidence scores."
            />
            <Step
              num={3}
              icon={Download}
              title="Review & Export"
              desc="Edit any field, then export a GoHighLevel-ready CSV with proper notes handling."
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">Built for Real-World Data</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature
              icon={ImageIcon}
              title="Vision Support"
              desc="Photograph a business card or handwritten note. The AI reads it all."
            />
            <Feature
              icon={Layers}
              title="Batch Mode"
              desc="Processing a 1,900-page Word doc? Paste 10 pages at a time, accumulate results, export once."
            />
            <Feature
              icon={Settings2}
              title="Parsing Rules"
              desc='Teach the AI your preferences: "Second phone is always fax", "Idaho area codes go to mobile".'
            />
            <Feature
              icon={Zap}
              title="Special Instructions"
              desc="Per-parse instructions let you handle edge cases without changing global rules."
            />
            <Feature
              icon={CheckCircle2}
              title="Confidence Scores"
              desc="Every field shows high/medium/low confidence so you know what needs review."
            />
            <Feature
              icon={Download}
              title="GHL-Ready CSV"
              desc="Export columns match GoHighLevel import format. Notes are properly formatted with dates."
            />
          </div>
        </div>
      </section>

      {/* Workflow guide */}
      <section className="py-16 border-t bg-muted/30">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-2">Recommended Workflow</h2>
          <p className="text-center text-muted-foreground mb-8">
            For large documents (hundreds of pages)
          </p>
          <div className="space-y-4">
            <WorkflowStep
              num={1}
              title="Start with 10 pages"
              desc="Paste a small sample and review the output. See what the AI gets right and what needs adjusting."
            />
            <WorkflowStep
              num={2}
              title="Dial in your rules"
              desc='Add parsing rules and special instructions until the output is 90%+ accurate. Example: "Notes section starts after the dashed line" or "Ignore page headers".'
            />
            <WorkflowStep
              num={3}
              title="Run the full document"
              desc="Once rules are set, batch-process the entire document. Paste 10-20 pages per batch for best results."
            />
            <WorkflowStep
              num={4}
              title="Review & export"
              desc="Spot-check the results, fix any outliers, then export a single CSV for GoHighLevel import."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 border-t">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to parse?</h2>
          <p className="text-muted-foreground">
            Bring your own OpenAI API key. Your data stays in your browser -- nothing is stored on our servers.
          </p>
          <Link
            href="/tool"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-8 py-3 text-base font-medium hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-5 w-5" />
            Open the Tool
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="max-w-5xl mx-auto px-6 text-center text-xs text-muted-foreground">
          Smart Contact Parser by Snappy CRM. Your API key and data never leave your browser.
        </div>
      </footer>
    </div>
  );
}

function Step({ num, icon: Icon, title, desc }: { num: number; icon: typeof FileText; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="relative">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-7 w-7 text-primary" />
        </div>
        <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {num}
        </span>
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: typeof FileText; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-2 hover:shadow-md transition-shadow">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}

function WorkflowStep({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
        {num}
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  );
}
