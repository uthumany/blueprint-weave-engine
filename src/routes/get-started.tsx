import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Scan, Layers, Component, Wand2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/get-started")({
  head: () => ({
    meta: [
      { title: "Get started — Design DNA" },
      { name: "description", content: "Four steps from any reference to a shipped, on-brand UI." },
      { property: "og:title", content: "Get started — Design DNA" },
      { property: "og:description", content: "Ingest → analyze → compose → generate." },
    ],
  }),
  component: GetStartedPage,
});

const steps = [
  { n: "01", icon: Scan,      title: "Ingest a reference", d: "Paste any public URL or drop a screenshot. We capture the specimen." },
  { n: "02", icon: Layers,    title: "Analyze with vision", d: "Gemini 2.5 Pro extracts color, type, spacing, motion, and effects into a typed profile." },
  { n: "03", icon: Component, title: "Add your content",   d: "Headlines, sections, copy — AI auto-maps your content into the profile's slots." },
  { n: "04", icon: Wand2,     title: "Generate & ship",    d: "Single-file HTML streams in. Refine via chat, export, and ship." },
];

function GetStartedPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <SiteHeader />

      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-lime transition-colors">
          <ArrowLeft className="size-3" /> back
        </Link>

        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime mt-8">› onboarding</p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] tracking-tight mt-3">
          Get <em className="text-lime not-italic">started</em> in four steps.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground leading-relaxed">
          From "I like the way that site looks" to "here's my version of it" — in about 30 seconds.
        </p>

        <ol className="mt-12 grid gap-4">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <li key={s.n} className="rounded-2xl glass p-5 sm:p-6 flex items-start gap-5">
                <div className="font-mono text-xs text-muted-foreground pt-1 w-8 shrink-0">{s.n}</div>
                <div className="size-10 rounded-lg bg-lime/15 grid place-items-center shrink-0">
                  <Icon className="size-5 text-lime" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-display text-2xl">{s.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{s.d}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 px-5 h-12 rounded-xl bg-lime text-primary-foreground font-medium hover:glow-lime transition-shadow"
          >
            <Scan className="size-4" />
            Analyze your first site
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/generate"
            className="inline-flex items-center gap-2 px-5 h-12 rounded-xl border border-border text-sm hover:border-lime/40 transition-colors"
          >
            <Wand2 className="size-4" /> Skip to generate
          </Link>
        </div>
      </section>
    </div>
  );
}
