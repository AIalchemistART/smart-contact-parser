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
  Shield,
  Heart,
  KeyRound,
  Eye,
  Globe,
  Users,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-background/90 backdrop-blur-md z-50 border-b">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="text-xl">🔍</span>
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Smart Contact Parser
            </span>
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="#philosophy" className="text-muted-foreground hover:text-primary transition-colors">Philosophy</Link>
            <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors hidden sm:block">Features</Link>
            <Link href="/donate.html" className="inline-flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white px-4 py-1.5 rounded-full font-medium hover:opacity-90 transition-opacity">
              <Heart className="h-3.5 w-3.5" />
              Donate
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 relative">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              AI-Powered &bull; BYOK &bull; 100% Client-Side
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
      <section id="features" className="py-16 border-t scroll-mt-16">
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
              title="File Batch Processing"
              desc="Drop a .txt file and walk away. The tool auto-chunks it, processes every section with AI, and accumulates all contacts — no copy-pasting required."
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

      {/* Philosophy */}
      <section id="philosophy" className="py-16 border-t scroll-mt-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-2">Built on Principles</h2>
          <p className="text-center text-muted-foreground mb-12">
            Smart Contact Parser isn&apos;t just a tool — it&apos;s a philosophy about how your data should be handled.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <PhilosophyCard
              icon={KeyRound}
              title="Bring Your Own Key (BYOK)"
              desc="Use your own OpenAI API key, stored only in your browser's localStorage. Never sent to our servers, never logged, never shared. You control your AI costs and your credentials."
            />
            <PhilosophyCard
              icon={Shield}
              title="Zero Server Storage"
              desc="Contact data is processed entirely client-side via direct OpenAI API calls from your browser. No database on our end, no server-side processing, no data retention."
            />
            <PhilosophyCard
              icon={Globe}
              title="Open Source & Transparent"
              desc="MIT Licensed. Every line of code is auditable on GitHub. No hidden analytics, no tracking pixels, no telemetry. You can verify exactly what happens with your data."
            />
            <PhilosophyCard
              icon={Users}
              title="Community-Sustained"
              desc="Free forever, sustained by community donations. No investors demanding monetization of your data. The incentives are aligned — building the best tool possible."
            />
          </div>
        </div>
      </section>

      {/* Security Banner */}
      <section className="py-12 border-t">
        <div className="max-w-3xl mx-auto px-6">
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-primary text-xl font-bold">
              <Eye className="h-6 w-6" />
              Why Client-Side Processing Matters
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Contact data is some of the most sensitive business information you handle.
              <strong className="text-foreground"> Names, emails, phone numbers, and company affiliations are high-value targets for data breaches.</strong>{" "}
              Smart Contact Parser sends your data directly from your browser to OpenAI&apos;s API — our servers never see it,
              never store it, never touch it. Combined with BYOK, this is the most private AI contact parsing architecture possible.
            </p>
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
              title="Drop the full document"
              desc='Once rules are set, switch to the File Batch tab, drop your .txt file, and click Start. The tool auto-chunks the entire document and processes it unattended.'
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
        <div className="max-w-3xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-2xl font-bold">Ready to parse?</h2>
          <p className="text-muted-foreground">
            Bring your own OpenAI API key. Your data stays in your browser — nothing is stored on our servers.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/tool"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground px-8 py-3 text-base font-medium hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="h-5 w-5" />
              Launch App Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/donate.html"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/5 text-primary px-8 py-3 text-base font-medium hover:bg-primary/10 transition-colors"
            >
              <Heart className="h-5 w-5" />
              Support Development
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 font-bold">
            <span>🔍</span>
            <span className="bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Smart Contact Parser
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; 2026 Smart Contact Parser by AI Alchemist. MIT License.
          </p>
          <p className="text-xs text-muted-foreground italic">
            &ldquo;Your data. Your API key. Your control.&rdquo;
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/tool" className="hover:text-primary transition-colors">Tool</Link>
            <Link href="/donate.html" className="hover:text-primary transition-colors">Donate</Link>
            <a href="https://github.com/AIalchemistART" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors inline-flex items-center gap-1">
              GitHub <ExternalLink className="h-3 w-3" />
            </a>
            <a href="https://www.aialchemist.net" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors inline-flex items-center gap-1">
              AI Alchemist <ExternalLink className="h-3 w-3" />
            </a>
          </div>
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

function PhilosophyCard({ icon: Icon, title, desc }: { icon: typeof FileText; title: string; desc: string }) {
  return (
    <div className="rounded-xl border-2 border-primary/20 bg-card p-6 space-y-3 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all group">
      <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
