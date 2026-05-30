import { FlaskConical, FolderOpen, Wand2, Github, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function SiteHeader() {
  const handleGetStarted = () => {
    const target = document.getElementById("ingest");
    const input = document.getElementById("ingest-input") as HTMLInputElement | null;
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      target.animate(
        [
          { boxShadow: "0 0 0 0 rgba(190,255,0,0)" },
          { boxShadow: "0 0 0 6px rgba(190,255,0,0.35)" },
          { boxShadow: "0 0 0 0 rgba(190,255,0,0)" },
        ],
        { duration: 900, easing: "ease-out" },
      );
    }
    setTimeout(() => input?.focus({ preventScroll: true }), 450);
  };

  return (
    <header className="sticky top-0 z-40">
      <div className="absolute inset-0 backdrop-blur-xl bg-background/60 border-b border-border" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative size-8 rounded-lg bg-lime grid place-items-center glow-lime">
            <FlaskConical className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-none hidden xs:block sm:block">
            <p className="font-display text-lg tracking-tight">Design DNA</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground mt-0.5">v0.1 · forensics</p>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-surface/60 border border-border">
          {[
            { icon: FlaskConical, label: "Analyze", active: true },
            { icon: FolderOpen,   label: "Profiles" },
            { icon: Wand2,        label: "Generate" },
          ].map((i) => {
            const Icon = i.icon;
            return (
              <button
                key={i.label}
                className={
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono transition-colors " +
                  (i.active ? "bg-ink text-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                <Icon className="size-3.5" />
                {i.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="https://github.com/zanwei/design-dna"
            target="_blank" rel="noreferrer"
            aria-label="View source on GitHub"
            className="hidden sm:inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-lime/40 transition-colors"
          >
            <Github className="size-4" />
            <span className="font-mono text-xs">github</span>
          </a>
          <motion.button
            type="button"
            onClick={handleGetStarted}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            aria-label="Get started — jump to the analyzer"
            className="group relative inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-lime hover:text-primary-foreground hover:glow-lime transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="hidden xs:inline sm:inline">Get started</span>
            <span className="xs:hidden sm:hidden">Start</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}

