import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FolderOpen, Lock, FileJson, Plus } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/profiles")({
  head: () => ({
    meta: [
      { title: "Profiles — Design DNA" },
      { name: "description", content: "Browse and manage your saved .dna.json design profiles." },
      { property: "og:title", content: "Profiles — Design DNA" },
      { property: "og:description", content: "Saved visual DNA extractions ready to compose with." },
    ],
  }),
  component: ProfilesPage,
});

function ProfilesPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <SiteHeader />

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-lime transition-colors">
          <ArrowLeft className="size-3" /> back
        </Link>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime mt-8">› the library</p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] tracking-tight mt-3">
          Your <em className="text-lime not-italic">profile</em> library.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground leading-relaxed">
          Saved <span className="font-mono text-foreground">.dna.json</span> profiles live here — diff, hybridize, and ship them.
          Profiles are stored locally in this browser by default.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/"
            className="group rounded-2xl glass p-5 hover:border-lime/30 hover:-translate-y-0.5 transition-all flex flex-col items-start min-h-[180px] justify-between"
          >
            <div className="size-10 rounded-lg bg-lime/15 grid place-items-center">
              <Plus className="size-5 text-lime" />
            </div>
            <div>
              <h3 className="font-display text-2xl">New profile</h3>
              <p className="font-mono text-[11px] text-muted-foreground mt-1">analyze a website →</p>
            </div>
          </Link>

          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl glass p-5 min-h-[180px] flex flex-col justify-between opacity-60">
              <FolderOpen className="size-5 text-muted-foreground" />
              <div>
                <h3 className="font-display text-2xl">empty.slot</h3>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">no profile saved</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Lock className="size-3 text-lime" /> local-only storage</span>
          <span className="inline-flex items-center gap-1.5"><FileJson className="size-3 text-lime" /> portable .dna.json</span>
        </div>
      </section>
    </div>
  );
}
