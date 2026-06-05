import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Wand2, Component, FileJson, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "Generate — NOTEPADIFY" },
      { name: "description", content: "Compose pixel-faithful UIs from a saved design profile and your own content." },
      { property: "og:title", content: "Generate — NOTEPADIFY" },
      { property: "og:description", content: "Profile + content → single-file HTML, streamed by AI." },
    ],
  }),
  component: GeneratePage,
});

function GeneratePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <SiteHeader />

      <section className="relative container-page pt-12 sm:pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-lime transition-colors">
          <ArrowLeft className="size-3" /> back
        </Link>

        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime mt-8">› the composer</p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] tracking-tight mt-3">
          Compose with <em className="text-lime not-italic">DNA</em>.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground leading-relaxed">
          Drop a profile, paste your content, and stream a single-file HTML page styled exactly like the reference.
        </p>

        <div className="mt-12 grid lg:grid-cols-[1fr_1.2fr] gap-8">
          <div className="rounded-2xl glass p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">profile · source</p>
            <div className="mt-4 rounded-xl border border-dashed border-border p-8 text-center">
              <FileJson className="size-6 mx-auto text-muted-foreground" />
              <p className="font-mono text-xs text-muted-foreground mt-3">Drop a .dna.json — or pick from <Link to="/profiles" className="text-lime hover:underline">profiles</Link></p>
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mt-8">your · content</p>
            <textarea
              placeholder={"# Headline\nLead paragraph...\n\n## Section\n- item\n- item"}
              className="mt-3 w-full h-44 rounded-xl bg-surface/60 border border-border p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-lime/40 resize-none"
            />

            <button
              type="button"
              className="mt-6 inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-lime text-primary-foreground font-medium hover:glow-lime transition-shadow"
            >
              <Wand2 className="size-4" /> Generate page
              <Sparkles className="size-3.5 opacity-70" />
            </button>
          </div>

          <div className="rounded-2xl glass p-6 min-h-[420px] flex items-center justify-center">
            <div className="text-center">
              <Component className="size-8 mx-auto text-muted-foreground" />
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mt-4">preview · pending</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-xs">Your composed page will stream in here.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
