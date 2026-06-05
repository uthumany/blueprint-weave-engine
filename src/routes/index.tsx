import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Scan, FileJson, Wand2, Layers, Component, Download,
  ArrowRight, Lock, Zap, AlertTriangle, Copy,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { IngestionPanel } from "@/components/IngestionPanel";
import { ExtractionLog } from "@/components/ExtractionLog";
import { AnalysisProgress } from "@/components/AnalysisProgress";
import { ProfilePreview } from "@/components/ProfilePreview";
import { DnaHelix } from "@/components/DnaHelix";
import { useAnalyze } from "@/lib/useAnalyze";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Design DNA — Reverse-engineer any website's visual identity" },
      { name: "description", content: "Point at any URL or screenshot. Extract a complete design profile — colors, type, motion, effects — then generate full UIs from it." },
      { property: "og:title", content: "Design DNA — Visual Style Analyzer & UI Generator" },
      { property: "og:description", content: "Forensic-grade visual DNA extraction. Reusable design profiles. AI-generated single-file UIs." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  component: Home,
});

function slugify(s: string) {
  return s
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 48) || "profile";
}

function Home() {
  const { analyze, cancel, lines, live, tokens, profile, screenshot, source, error, phase, elapsedMs } = useAnalyze();

  const downloadProfile = () => {
    if (!profile) {
      toast.error("Analyze a website first to generate a .dna.json.");
      return;
    }
    const name = source?.label ? slugify(source.label) : "profile";
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.dna.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Saved ${name}.dna.json`);
  };

  const copyProfile = () => {
    if (!profile) {
      toast.error("Nothing to copy yet — run an analysis.");
      return;
    }
    navigator.clipboard
      ?.writeText(JSON.stringify(profile, null, 2))
      .then(() => toast.success("Profile JSON copied to clipboard"))
      .catch(() => toast.error("Could not copy to clipboard"));
  };

  const generateFromProfile = () => {
    if (!profile) {
      toast.error("Analyze a reference first, then generate.");
      return;
    }
    toast("Generator launching soon", {
      description: "The compose-from-profile flow ships in the next drop.",
    });
  };

  const scrollToIngest = () => {
    document.getElementById("ingest")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => {
      (document.getElementById("ingest-input") as HTMLInputElement | null)?.focus({ preventScroll: true });
    }, 450);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background field */}
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute inset-0 bg-grain opacity-30 pointer-events-none mix-blend-overlay" />

      <SiteHeader />

      {/* HERO */}
      <section className="relative container-page pt-12 sm:pt-16 pb-20 sm:pb-24">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-12 items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
            >
              <span className="size-1.5 rounded-full bg-lime animate-pulse-dot" />
              forensic visual extraction · v0.1 alpha
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display text-[clamp(2.5rem,7vw,6.5rem)] leading-[0.95] tracking-tight mt-6"
            >
              Reverse-engineer<br/>
              the <em className="text-lime text-glow not-italic">visual DNA</em> of<br/>
              any interface.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 max-w-xl text-base text-muted-foreground leading-relaxed"
            >
              Point at any website or paste a screenshot. Design DNA extracts the
              complete design system — color, typography, spacing, motion, effects —
              into a portable <span className="font-mono text-foreground">.dna.json</span> profile,
              then generates pixel-faithful UIs from your own content.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8"
            >
              <IngestionPanel onAnalyze={analyze} onCancel={cancel} busy={live} />
              {error && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg border border-magenta/40 bg-magenta/[0.06] font-mono text-[11px] text-magenta">
                  <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                  <span className="break-all">{error}</span>
                </div>
              )}
            </motion.div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Lock className="size-3 text-lime" /> profiles stored locally</span>
              <span className="inline-flex items-center gap-1.5"><Zap className="size-3 text-lime" /> ~8s analysis</span>
              <span className="inline-flex items-center gap-1.5"><FileJson className="size-3 text-lime" /> portable .dna.json</span>
            </div>
          </div>

          {/* Right column — helix + extraction log */}
          <div className="relative order-first lg:order-none">
            <div className="relative h-[320px] sm:h-[420px] rounded-3xl glass overflow-hidden">
              <div className="absolute inset-0 bg-mesh opacity-60" />
              <div className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                specimen · web.helix
              </div>
              <DnaHelix />
              <div className="absolute bottom-4 right-4 font-mono text-[10px] text-muted-foreground">
                <span className={`text-lime ${live ? "animate-pulse-dot inline-block" : ""}`}>●</span>{" "}
                {live ? "sampling tokens…" : tokens > 0 ? `${tokens.toLocaleString()} chars sampled` : "sampling 312 rules"}
              </div>
            </div>
            <div className="mt-4">
              <AnalysisProgress live={live} phase={phase} elapsedMs={elapsedMs} tokens={tokens} />
              <ExtractionLog
                lines={lines.length > 0 || live ? lines : undefined}
                live={live}
                tokenCount={tokens}
              />
            </div>
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="relative container-page py-16 sm:py-20 border-t border-border">
        <div className="flex items-end justify-between mb-10 sm:mb-12 flex-wrap gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">› the pipeline</p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight mt-3">From specimen to system to ship.</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Four deterministic stages. Editable at every step. Nothing leaves your browser unless you ask it to.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { n: "01", icon: Scan,      title: "Ingest",   d: "URL · screenshot · image link. Microlink + DOM parse + computed CSS.", action: scrollToIngest },
            { n: "02", icon: Layers,    title: "Analyze",  d: "Gemini vision extracts 7 design dimensions into a typed profile.",      action: scrollToIngest },
            { n: "03", icon: Component, title: "Compose",  d: "Drop in your content. AI auto-maps copy to slots. Edit anything.",     action: generateFromProfile },
            { n: "04", icon: Wand2,     title: "Generate", d: "Single-file HTML streams in. Refine via chat. Export & ship.",         action: generateFromProfile },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.button
                key={s.n}
                type="button"
                onClick={s.action}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative text-left rounded-2xl glass p-5 hover:border-lime/30 hover:-translate-y-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
                  <Icon className="size-4 text-lime" />
                </div>
                <h3 className="font-display text-2xl mt-8">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
                <ArrowRight className="absolute bottom-5 right-5 size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-lime transition-all group-hover:translate-x-0.5" />
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* PROFILE SHOWCASE */}
      <section id="profile" className="relative container-page py-16 sm:py-20 border-t border-border scroll-mt-24">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-start">
          <div className="lg:sticky lg:top-24">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">› the artifact</p>
            <h2 className="font-display text-4xl sm:text-5xl tracking-tight mt-3 leading-[0.95]">
              A design system,<br/>distilled to <em className="text-lime not-italic">JSON</em>.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-md leading-relaxed">
              Every analyzed reference becomes a <span className="font-mono text-foreground">.dna.json</span> file —
              seven dimensions, fully typed, fully portable. Save it, tag it, diff it against
              other profiles, hybridize two systems into a third, or hand it off as a starting
              point for your own design tokens.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={generateFromProfile}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-lime text-primary-foreground font-medium text-sm hover:glow-lime transition-shadow disabled:opacity-50"
              >
                <Wand2 className="size-4" /> Generate from profile
              </button>
              <button
                type="button"
                onClick={downloadProfile}
                disabled={!profile}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-border text-sm hover:border-lime/40 transition-colors disabled:opacity-40 disabled:hover:border-border"
              >
                <Download className="size-4" /> Download .dna.json
              </button>
              <button
                type="button"
                onClick={copyProfile}
                disabled={!profile}
                className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-border text-sm hover:border-lime/40 transition-colors disabled:opacity-40 disabled:hover:border-border"
              >
                <Copy className="size-4" /> Copy JSON
              </button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
              {[
                { k: "dimensions", v: "07" },
                { k: "tokens / profile", v: profile ? String(profile.palette.length + profile.spacing.scale.length + 8).padStart(2, "0") : "~84" },
                { k: "confidence", v: profile ? `${Math.round(profile.confidence * 100)}%` : "—" },
                { k: "free tier", v: "∞" },
              ].map((s) => (
                <div key={s.k} className="border-l border-border pl-3">
                  <p className="font-display text-3xl">{s.v}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{s.k}</p>
                </div>
              ))}
            </div>
          </div>

          <ProfilePreview profile={profile} screenshot={screenshot} source={source?.label} />
        </div>
      </section>

      {/* CTA */}
      <section id="cta" className="relative container-page py-20 sm:py-24 scroll-mt-24">
        <div className="relative rounded-3xl glass overflow-hidden p-8 sm:p-12 md:p-20 text-center">
          <div className="absolute inset-0 bg-mesh opacity-70" />
          <div className="relative">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">› step_01 / ingest</p>
            <h2 className="font-display text-[clamp(2rem,5vw,4.5rem)] leading-[1] tracking-tight mt-4 max-w-3xl mx-auto">
              Stop guessing at someone else's design. <em className="text-lime not-italic">Sequence it.</em>
            </h2>
            <button
              type="button"
              onClick={scrollToIngest}
              className="group mt-10 inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-lime text-primary-foreground font-medium hover:glow-lime transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Scan className="size-4" />
              Analyze a website
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative container-page py-10 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-muted-foreground">
            © 2026 Design DNA · built on{" "}
            <a className="text-foreground hover:text-lime" href="https://github.com/zanwei/design-dna" target="_blank" rel="noreferrer">
              zanwei/design-dna
            </a>
          </p>
          <div className="flex gap-5 font-mono text-[11px] text-muted-foreground">
            <a href="https://github.com/zanwei/design-dna#readme" target="_blank" rel="noreferrer" className="hover:text-lime">docs</a>
            <button type="button" onClick={copyProfile} className="hover:text-lime">schema</button>
            <a href="https://github.com/zanwei/design-dna/releases" target="_blank" rel="noreferrer" className="hover:text-lime">changelog</a>
            <a href="https://github.com/zanwei/design-dna/blob/main/LICENSE" target="_blank" rel="noreferrer" className="hover:text-lime">license</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
