import { Palette, Type, LayoutGrid, Layers, Sparkles, Play } from "lucide-react";

const swatches = [
  { h: "#0B0D10", n: "ink" },
  { h: "#5E6AD2", n: "primary" },
  { h: "#9EE756", n: "accent" },
  { h: "#F2F2F2", n: "fg" },
  { h: "#2A2D33", n: "surface" },
  { h: "#E8345A", n: "alert" },
];

const tags = ["futuristic", "minimal", "dark", "editorial", "precise"];

export function ProfilePreview() {
  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">linear.app · 2026.05.30</p>
          <h3 className="font-display text-2xl mt-1">Design Profile</h3>
        </div>
        <span className="font-mono text-[10px] px-2 py-1 rounded-md bg-lime/15 text-lime border border-lime/30">
          confidence · 94%
        </span>
      </div>

      {/* Color */}
      <Section icon={Palette} label="Color System">
        <div className="grid grid-cols-6 gap-2">
          {swatches.map((s) => (
            <div key={s.n} className="space-y-1.5">
              <div className="aspect-square rounded-lg border border-border" style={{ background: s.h }} />
              <p className="font-mono text-[9px] text-muted-foreground truncate">{s.n}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Typography */}
      <Section icon={Type} label="Typography">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-ink/40 border border-border p-3">
            <p className="font-display text-3xl leading-none">Aa</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-2">Instrument Serif · display</p>
          </div>
          <div className="rounded-lg bg-ink/40 border border-border p-3">
            <p className="text-3xl leading-none font-medium">Aa</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-2">Inter · body / 4 weights</p>
          </div>
        </div>
      </Section>

      {/* Layout + effects row */}
      <div className="grid grid-cols-2 gap-3">
        <Section icon={LayoutGrid} label="Spacing">
          <div className="flex items-end gap-1.5">
            {[4, 8, 12, 16, 24, 32, 48].map((n) => (
              <div key={n} className="flex flex-col items-center gap-1.5">
                <div className="w-3 bg-lime/70 rounded-sm" style={{ height: n }} />
                <span className="font-mono text-[9px] text-muted-foreground">{n}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section icon={Layers} label="Effects">
          <div className="flex flex-wrap gap-1.5">
            {["blur(24px)", "noise·0.04", "shadow·xl", "radial-mesh"].map((e) => (
              <span key={e} className="font-mono text-[10px] px-2 py-1 rounded-md bg-surface border border-border">
                {e}
              </span>
            ))}
          </div>
        </Section>
      </div>

      <Section icon={Sparkles} label="Mood">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span
              key={t}
              className="font-mono text-[10px] px-2 py-1 rounded-md border"
              style={{
                background: i === 0 ? "var(--accent)" : "transparent",
                borderColor: i === 0 ? "var(--lime)" : "var(--border)",
                color: i === 0 ? "var(--lime)" : "var(--muted-foreground)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      </Section>

      <Section icon={Play} label="Motion">
        <div className="h-12 rounded-lg bg-ink/40 border border-border relative overflow-hidden">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 48" preserveAspectRatio="none">
            <path d="M0,40 C40,40 60,8 100,8 C140,8 160,40 200,40" stroke="oklch(0.92 0.20 130)" strokeWidth="1.5" fill="none" />
          </svg>
          <span className="absolute bottom-1.5 right-2 font-mono text-[10px] text-muted-foreground">cubic-bezier · 240ms</span>
        </div>
      </Section>
    </div>
  );
}

function Section({ icon: Icon, label, children }: { icon: typeof Palette; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-lime" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      </div>
      {children}
    </div>
  );
}
