import { FlaskConical, FolderOpen, Wand2, Github, ArrowRight, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

function scrollTo(id: string, focusInput = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.animate(
    [
      { boxShadow: "0 0 0 0 rgba(190,255,0,0)" },
      { boxShadow: "0 0 0 6px rgba(190,255,0,0.35)" },
      { boxShadow: "0 0 0 0 rgba(190,255,0,0)" },
    ],
    { duration: 900, easing: "ease-out" },
  );
  if (focusInput) {
    setTimeout(() => {
      (document.getElementById("ingest-input") as HTMLInputElement | null)?.focus({ preventScroll: true });
    }, 450);
  }
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const nav = [
    { icon: FlaskConical, label: "Analyze",  target: "ingest"  },
    { icon: FolderOpen,   label: "Profiles", target: "profile" },
    { icon: Wand2,        label: "Generate", target: "cta"     },
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="absolute inset-0 backdrop-blur-xl bg-background/60 border-b border-border" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <a href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative size-8 rounded-lg bg-lime grid place-items-center glow-lime">
            <FlaskConical className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <p className="font-display text-lg tracking-tight">Design DNA</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground mt-0.5 hidden sm:block">v0.1 · forensics</p>
          </div>
        </a>

        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-surface/60 border border-border">
          {nav.map((i, idx) => {
            const Icon = i.icon;
            const active = idx === 0;
            return (
              <button
                key={i.label}
                type="button"
                onClick={() => scrollTo(i.target, idx === 0)}
                className={
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono transition-colors " +
                  (active ? "bg-ink text-foreground" : "text-muted-foreground hover:text-foreground")
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
            onClick={() => scrollTo("ingest", true)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
            aria-label="Get started — jump to the analyzer"
            className="group relative inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-lime hover:text-primary-foreground hover:glow-lime transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span>Get started</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center size-9 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="md:hidden relative border-b border-border bg-background/90 backdrop-blur-xl"
          >
            <div className="max-w-7xl mx-auto px-4 py-3 grid gap-1">
              {nav.map((i, idx) => {
                const Icon = i.icon;
                return (
                  <button
                    key={i.label}
                    type="button"
                    onClick={() => { setOpen(false); scrollTo(i.target, idx === 0); }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-surface/60 transition-colors"
                  >
                    <Icon className="size-4" />
                    {i.label}
                  </button>
                );
              })}
              <a
                href="https://github.com/zanwei/design-dna"
                target="_blank" rel="noreferrer"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-surface/60 transition-colors"
              >
                <Github className="size-4" />
                github
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
