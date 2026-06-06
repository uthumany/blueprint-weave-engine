import { Palette, Type, LayoutGrid, Layers, Sparkles, Play, Image as ImageIcon } from "lucide-react";
import type { DnaProfile } from "@/lib/useAnalyze";

const FALLBACK: DnaProfile = {
  mood: ["futuristic", "minimal", "dark", "editorial", "precise"],
  palette: [
    { name: "ink",     hex: "#0B0D10", role: "bg" },
    { name: "primary", hex: "#5E6AD2", role: "accent" },
    { name: "accent",  hex: "#9EE756", role: "accent-2" },
    { name: "fg",      hex: "#F2F2F2", role: "text" },
    { name: "surface", hex: "#2A2D33", role: "surface" },
    { name: "alert",   hex: "#E8345A", role: "muted" },
  ],
  typography: { display: "Instrument Serif", body: "Inter", scale: ["12", "14", "16", "20", "28", "40"] },
  spacing: { base: 4, scale: [4, 8, 12, 16, 24, 32, 48] },
  radius: { sm: 4, md: 8, lg: 16, full: 9999 },
  effects: { shadow: "shadow·xl", blur: "blur(24px)", noise: true, grain: true },
  motion: { ease: "cubic-bezier(.2,.8,.2,1)", duration_ms: 240 },
  confidence: 0.94,
};

export function ProfilePreview({
  profile,
  screenshot,
  source,
}: {
  profile?: DnaProfile | null;
  screenshot?: string | null;
  source?: string | null;
}) {
  const p = profile ?? FALLBACK;
  const isLive = !!profile;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  const label = source ?? "linear.app";

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground truncate max-w-[280px]">
            {label} · {today}
          </p>
          <h3 className="font-display text-2xl mt-1">Design Profile {isLive && <span className="text-lime">·</span>}</h3>
        </div>
        <span className="font-mono text-[10px] px-2 py-1 rounded-md bg-lime/15 text-lime border border-lime/30 shrink-0">
          confidence · {Math.round(p.confidence * 100)}%
        </span>
      </div>

      {screenshot && (
        <Section icon={ImageIcon} label="Specimen">
          <div className="rounded-lg overflow-hidden border border-border bg-ink/40 aspect-video">
            {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
            <img src={screenshot} alt="Captured screenshot" className="w-full h-full object-cover" />
          </div>
        </Section>
      )}

      <Section icon={Palette} label="Color System">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {p.palette.slice(0, 12).map((s, i) => (
            <button
              key={`${s.name}-${i}`}
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(s.hex).catch(() => {});
              }}
              title={`Copy ${s.hex}`}
              className="text-left space-y-1.5 group"
            >
              <div
                className="aspect-square rounded-lg border border-border group-hover:border-lime/50 transition-colors"
                style={{ background: s.hex }}
              />
              <p className="font-mono text-[9px] text-muted-foreground truncate">{s.name}</p>
              <p className="font-mono text-[9px] text-muted-foreground/60 truncate">{s.hex}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Type} label="Typography">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-ink/40 border border-border p-3">
            <p className="font-display text-3xl leading-none">Aa</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-2 truncate">{p.typography.display} · display</p>
          </div>
          <div className="rounded-lg bg-ink/40 border border-border p-3">
            <p className="text-3xl leading-none font-medium">Aa</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-2 truncate">{p.typography.body} · body</p>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section icon={LayoutGrid} label={`Spacing · base ${p.spacing.base}`}>
          <div className="flex items-end gap-1.5 flex-wrap">
            {p.spacing.scale.slice(0, 8).map((n, i) => (
              <div key={`${n}-${i}`} className="flex flex-col items-center gap-1.5">
                <div className="w-3 bg-lime/70 rounded-sm" style={{ height: Math.min(n, 56) }} />
                <span className="font-mono text-[9px] text-muted-foreground">{n}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section icon={Layers} label="Effects">
          <div className="flex flex-wrap gap-1.5">
            {[
              p.effects.blur && `blur·${p.effects.blur}`,
              p.effects.noise && "noise",
              p.effects.grain && "grain",
              p.effects.shadow,
            ].filter(Boolean).map((e) => (
              <span key={String(e)} className="font-mono text-[10px] px-2 py-1 rounded-md bg-surface border border-border truncate max-w-[140px]">
                {String(e)}
              </span>
            ))}
          </div>
        </Section>
      </div>

      <Section icon={Sparkles} label="Mood">
        <div className="flex flex-wrap gap-1.5">
          {p.mood.map((t, i) => (
            <span
              key={`${t}-${i}`}
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
          <span className="absolute bottom-1.5 right-2 font-mono text-[10px] text-muted-foreground truncate max-w-[60%]">
            {p.motion.ease.replace("cubic-bezier", "cb")} · {p.motion.duration_ms}ms
          </span>
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
