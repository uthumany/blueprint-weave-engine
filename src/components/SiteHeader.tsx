import { FlaskConical, FolderOpen, Wand2, Github } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div className="absolute inset-0 backdrop-blur-xl bg-background/60 border-b border-border" />
      <div className="relative max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="relative size-8 rounded-lg bg-lime grid place-items-center glow-lime">
            <FlaskConical className="size-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
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
            className="hidden sm:inline-flex items-center gap-2 px-3 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-lime/40 transition-colors"
          >
            <Github className="size-4" />
            <span className="font-mono text-xs">github</span>
          </a>
          <button className="inline-flex items-center gap-2 px-3.5 h-9 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-lime transition-colors">
            Get started
          </button>
        </div>
      </div>
    </header>
  );
}
