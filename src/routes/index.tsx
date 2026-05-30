import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Scan, FileJson, Wand2, Layers, Component, Download,
  ArrowRight, Lock, Zap, AlertTriangle,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { IngestionPanel } from "@/components/IngestionPanel";
import { ExtractionLog } from "@/components/ExtractionLog";
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

function Home() {
  const { analyze, lines, live, tokens, error } = useAnalyze();
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background field */}
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="absolute inset-0 bg-grain opacity-30 pointer-events-none mix-blend-overlay" />

      <SiteHeader />

      {/* HERO */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
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
              className="font-display text-[clamp(3rem,7vw,6.5rem)] leading-[0.95] tracking-tight mt-6"
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
              <IngestionPanel onAnalyze={analyze} />
              {error && (
                <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg border border-magenta/40 bg-magenta/[0.06] font-mono text-[11px] text-magenta">
                  <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                  <span>{error}</span>
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
          <div className="relative">
            <div className="relative h-[420px] rounded-3xl glass overflow-hidden">
              <div className="absolute inset-0 bg-mesh opacity-60" />
              <div className="absolute top-4 left-4 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                specimen · web.helix
              </div>
              <DnaHelix />
              <div className="absolute bottom-4 right-4 font-mono text-[10px] text-muted-foreground">
                <span className="text-lime">●</span> sampling 312 rules
              </div>
            </div>
            <div className="mt-4">
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
      <section className="relative max-w-7xl mx-auto px-6 py-20 border-t border-border">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">› the pipeline</p>
            <h2 className="font-display text-5xl tracking-tight mt-3">From specimen to system to ship.</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Four deterministic stages. Editable at every step. Nothing leaves your browser unless you ask it to.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { n: "01", icon: Scan,      title: "Ingest",   d: "URL · screenshot · image link. Microlink + DOM parse + computed CSS." },
            { n: "02", icon: Layers,    title: "Analyze",  d: "Claude vision extracts 7 design dimensions into a typed profile." },
            { n: "03", icon: Component, title: "Compose",  d: "Drop in your content. AI auto-maps copy to slots. Edit anything." },
            { n: "04", icon: Wand2,     title: "Generate", d: "Single-file HTML streams in. Refine via chat. Export & ship." },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative rounded-2xl glass p-5 hover:border-lime/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{s.n}</span>
                  <Icon className="size-4 text-lime" />
                </div>
                <h3 className="font-display text-2xl mt-8">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
                <ArrowRight className="absolute bottom-5 right-5 size-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-lime transition-all group-hover:translate-x-0.5" />
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* PROFILE SHOWCASE */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 border-t border-border">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="lg:sticky lg:top-24">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">› the artifact</p>
            <h2 className="font-display text-5xl tracking-tight mt-3 leading-[0.95]">
              A design system,<br/>distilled to <em className="text-lime not-italic">JSON</em>.
            </h2>
            <p className="text-muted-foreground mt-5 max-w-md leading-relaxed">
              Every analyzed reference becomes a <span className="font-mono text-foreground">.dna.json</span> file —
              seven dimensions, fully typed, fully portable. Save it, tag it, diff it against
              other profiles, hybridize two systems into a third, or hand it off as a starting
              point for your own design tokens.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-lime text-primary-foreground font-medium text-sm hover:glow-lime transition-shadow">
                <Wand2 className="size-4" /> Generate from profile
              </button>
              <button className="inline-flex items-center gap-2 px-4 h-10 rounded-lg border border-border text-sm hover:border-lime/40 transition-colors">
                <Download className="size-4" /> Download .dna.json
              </button>
            </div>

            <div className="mt-10 grid grid-cols-2 gap-4 max-w-md">
              {[
                { k: "dimensions", v: "07" },
                { k: "tokens / profile", v: "~84" },
                { k: "avg analysis", v: "8.4s" },
                { k: "free tier", v: "∞" },
              ].map((s) => (
                <div key={s.k} className="border-l border-border pl-3">
                  <p className="font-display text-3xl">{s.v}</p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">{s.k}</p>
                </div>
              ))}
            </div>
          </div>

          <ProfilePreview />
        </div>
      </section>

      {/* CTA */}
      <section className="relative max-w-7xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl glass overflow-hidden p-12 md:p-20 text-center">
          <div className="absolute inset-0 bg-mesh opacity-70" />
          <div className="relative">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">› step_01 / ingest</p>
            <h2 className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[1] tracking-tight mt-4 max-w-3xl mx-auto">
              Stop guessing at someone else's design. <em className="text-lime not-italic">Sequence it.</em>
            </h2>
            <button className="mt-10 inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-lime text-primary-foreground font-medium hover:glow-lime transition-shadow">
              <Scan className="size-4" />
              Analyze a website
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative max-w-7xl mx-auto px-6 py-10 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-[11px] text-muted-foreground">
            © 2026 Design DNA · built on <a className="text-foreground hover:text-lime" href="https://github.com/zanwei/design-dna">zanwei/design-dna</a>
          </p>
          <div className="flex gap-5 font-mono text-[11px] text-muted-foreground">
            <a href="#" className="hover:text-lime">docs</a>
            <a href="#" className="hover:text-lime">schema</a>
            <a href="#" className="hover:text-lime">changelog</a>
            <a href="#" className="hover:text-lime">privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
