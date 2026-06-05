import { FlaskConical, FolderOpen, Wand2, Github, ArrowRight, Menu, X, GitBranch } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

type NavItem = { icon: typeof FlaskConical; label: string; to: string };

const nav: NavItem[] = [
  { icon: FlaskConical, label: "Analyze",  to: "/" },
  { icon: FolderOpen,   label: "Profiles", to: "/profiles" },
  { icon: Wand2,        label: "Generate", to: "/generate" },
  { icon: GitBranch,    label: "Repo→Prompt", to: "/repo-to-prompt" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40">
      <div className="absolute inset-0 backdrop-blur-xl bg-background/60 border-b border-border" />
      <div className="relative container-page h-16 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative size-8 rounded-lg bg-lime grid place-items-center glow-lime">
            <FlaskConical className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <p className="font-display text-lg tracking-tight">NOTEPADIFY</p>
            <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground mt-0.5 hidden sm:block">v0.1 · forensics</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-surface/60 border border-border">
          {nav.map((i) => {
            const Icon = i.icon;
            const active = pathname === i.to;
            return (
              <Link
                key={i.label}
                to={i.to}
                className={
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono transition-colors " +
                  (active ? "bg-ink text-foreground" : "text-muted-foreground hover:text-foreground")
                }
              >
                <Icon className="size-3.5" />
                {i.label}
              </Link>
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
          <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }} transition={{ type: "spring", stiffness: 500, damping: 28 }}>
            <Link
              to="/get-started"
              aria-label="Get started"
              className="group relative inline-flex items-center gap-1.5 px-3 sm:px-4 h-9 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-lime hover:text-primary-foreground hover:glow-lime transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span>Get started</span>
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>
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
            <div className="container-page py-3 grid gap-1">
              {nav.map((i) => {
                const Icon = i.icon;
                return (
                  <Link
                    key={i.label}
                    to={i.to}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-muted-foreground hover:text-foreground hover:bg-surface/60 transition-colors"
                  >
                    <Icon className="size-4" />
                    {i.label}
                  </Link>
                );
              })}
              <Link
                to="/get-started"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-mono text-lime hover:bg-surface/60 transition-colors"
              >
                <ArrowRight className="size-4" />
                Get started
              </Link>
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
