import { Palette, Type, LayoutGrid, Layers, Sparkles, Image as ImageIcon, ThumbsUp, ThumbsDown, CornerDownRight } from "lucide-react";
import { useState } from "react";
import type { DnaProfile } from "@/lib/analyzer/schema";
import { recordFeedback } from "@/lib/memory/memory.functions";

const FALLBACK: DnaProfile = {
  scrapedAt: new Date().toISOString(),
  colors: {
    bg: "#0B0D10", bgSecondary: "#12151A", text: "#F2F2F2", textSecondary: "#9CA3AF",
    primary: "#5E6AD2", secondary: "#9EE756", border: "#2A2D33",
    palette: [
      { hex: "#0B0D10", role: "block", count: 12, contrast: "light" },
      { hex: "#5E6AD2", role: "text-accent", count: 8, contrast: "light" },
      { hex: "#9EE756", role: "text-accent", count: 6, contrast: "dark" },
      { hex: "#F2F2F2", role: "text-accent", count: 5, contrast: "dark" },
      { hex: "#2A2D33", role: "block", count: 4, contrast: "light" },
      { hex: "#E8345A", role: "text-accent", count: 2, contrast: "light" },
    ],
  },
  typography: {
    headingFont: { family: "Instrument Serif", cleanFamily: "Instrument Serif", weights: ["400"], usedFor: "heading", fallback: "serif" },
    bodyFont: { family: "Inter", cleanFamily: "Inter", weights: ["400", "600"], usedFor: "body", fallback: "sans-serif" },
    fontSizes: [40, 28, 20, 16, 14, 12],
    lineHeights: [],
    details: [],
  },
  spacing: { base: 4, common: [{ value: 4, count: 10, role: "element" }, { value: 8, count: 8, role: "element" }, { value: 16, count: 6, role: "element" }, { value: 32, count: 3, role: "card" }] },
  borderRadius: [{ value: 8, count: 6, role: "button" }, { value: 16, count: 3, role: "card" }],
  shadows: [],
  components: { primaryButton: null, buttons: [], card: null },
  fontFaces: [],
  cssCustomProperties: [],
  tags: ["futuristic", "minimal", "dark"],
  mood: "Futuristic, minimal, dark editorial.",
  confidence: 0.94,
};

export function ProfilePreview({
  profile,
  screenshot,
  source,
  peerId,
}: {
  profile?: DnaProfile | null;
  screenshot?: string | null;
  source?: string | null;
  peerId?: string;
}) {
  const p = profile ?? FALLBACK;
  const isLive = !!profile;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, ".");
  const label = source ?? "linear.app";
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const sendFeedback = (kept: boolean) => {
    if (!peerId || !isLive) return;
    setFeedback(kept ? "up" : "down");
    recordFeedback({ data: { peerId, source: label, kept } }).catch(() => { /* silent */ });
  };

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground truncate max-w-[280px]">
            {label} · {today}
          </p>
          <h3 className="font-display text-2xl mt-1">Design Profile {isLive && <span className="text-lime">·</span>}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isLive && peerId && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Keep this profile — teach memory"
                onClick={() => sendFeedback(true)}
                className={"size-7 grid place-items-center rounded-md border transition-colors " + (feedback === "up" ? "border-lime/60 text-lime bg-lime/10" : "border-border text-muted-foreground hover:text-lime hover:border-lime/40")}
              >
                <ThumbsUp className="size-3.5" />
              </button>
              <button
                type="button"
                aria-label="Reject — memory will avoid this style"
                onClick={() => sendFeedback(false)}
                className={"size-7 grid place-items-center rounded-md border transition-colors " + (feedback === "down" ? "border-magenta/60 text-magenta bg-magenta/10" : "border-border text-muted-foreground hover:text-magenta hover:border-magenta/40")}
              >
                <ThumbsDown className="size-3.5" />
              </button>
            </div>
          )}
          <span className="font-mono text-[10px] px-2 py-1 rounded-md bg-lime/15 text-lime border border-lime/30 shrink-0">
            confidence · {Math.round(p.confidence * 100)}%
          </span>
        </div>
      </div>

      {screenshot && (
        <Section icon={ImageIcon} label="Specimen">
          <div className="rounded-lg overflow-hidden border border-border bg-ink/40 aspect-video">
            {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
            <img src={screenshot} alt="Captured screenshot" className="w-full h-full object-cover" />
          </div>
        </Section>
      )}

      <Section icon={Palette} label={`Color System · ${p.colors.palette.length} tokens`}>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {p.colors.palette.slice(0, 12).map((s, i) => (
            <button
              key={`${s.hex}-${i}`}
              type="button"
              onClick={() => navigator.clipboard?.writeText(s.hex).catch(() => {})}
              title={`Copy ${s.hex}`}
              className="text-left space-y-1.5 group"
            >
              <div
                className="aspect-square rounded-lg border border-border group-hover:border-lime/50 transition-colors"
                style={{ background: s.hex }}
              />
              <p className="font-mono text-[9px] text-muted-foreground truncate">{s.role}</p>
              <p className="font-mono text-[9px] text-muted-foreground/60 truncate">{s.hex}</p>
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-mono text-[9px] text-muted-foreground">
          {(["bg", "text", "primary", "secondary", "border", "bgSecondary", "textSecondary"] as const).map((k) => (
            <div key={k} className="flex items-center gap-1.5 truncate">
              <span className="size-3 rounded-sm border border-border shrink-0" style={{ background: p.colors[k] }} />
              <span className="truncate">{k} · {p.colors[k]}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section icon={Type} label="Typography">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-ink/40 border border-border p-3">
            <p className="font-display text-3xl leading-none">Aa</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-2 truncate">{p.typography.headingFont.cleanFamily} · display</p>
          </div>
          <div className="rounded-lg bg-ink/40 border border-border p-3">
            <p className="text-3xl leading-none font-medium">Aa</p>
            <p className="font-mono text-[10px] text-muted-foreground mt-2 truncate">{p.typography.bodyFont.cleanFamily} · body</p>
          </div>
        </div>
        {p.typography.fontSizes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.typography.fontSizes.slice(0, 8).map((s, i) => (
              <span key={i} className="font-mono text-[10px] px-2 py-1 rounded-md bg-surface border border-border">{s}px</span>
            ))}
          </div>
        )}
        {p.fontFaces.length > 0 && (
          <p className="mt-2 font-mono text-[10px] text-lime">@font-face · {p.fontFaces.length} loaded</p>
        )}
      </Section>

      <div className="grid grid-cols-2 gap-3">
        <Section icon={LayoutGrid} label={`Spacing · base ${p.spacing.base}px`}>
          <div className="flex items-end gap-1.5 flex-wrap">
            {p.spacing.common.slice(0, 8).map((s, i) => (
              <div key={`${s.value}-${i}`} className="flex flex-col items-center gap-1.5">
                <div className="w-3 bg-lime/70 rounded-sm" style={{ height: Math.min(s.value, 56) }} />
                <span className="font-mono text-[9px] text-muted-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section icon={CornerDownRight} label="Radius">
          <div className="flex flex-wrap gap-1.5">
            {p.borderRadius.slice(0, 6).map((r, i) => (
              <span key={i} className="font-mono text-[10px] px-2 py-1 rounded-md bg-surface border border-border">
                {r.value}px · {r.role}
              </span>
            ))}
            {p.borderRadius.length === 0 && <span className="font-mono text-[10px] text-muted-foreground">none detected</span>}
          </div>
        </Section>
      </div>

      <Section icon={Layers} label={`Shadows · ${p.shadows.length}`}>
        <div className="flex flex-wrap gap-1.5">
          {p.shadows.slice(0, 4).map((s, i) => (
            <span key={i} className="font-mono text-[10px] px-2 py-1 rounded-md bg-surface border border-border">
              {s.level}
            </span>
          ))}
          {p.shadows.length === 0 && <span className="font-mono text-[10px] text-muted-foreground">flat surfaces</span>}
        </div>
      </Section>

      <Section icon={Sparkles} label="Mood & Tags">
        <p className="text-sm text-muted-foreground mb-2">{p.mood}</p>
        <div className="flex flex-wrap gap-1.5">
          {p.tags.map((t, i) => (
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

      {p.cssCustomProperties.length > 0 && (
        <Section icon={LayoutGrid} label={`CSS Custom Properties · ${p.cssCustomProperties.length}`}>
          <div className="rounded-lg bg-ink/40 border border-border p-2 max-h-40 overflow-y-auto space-y-1 font-mono text-[10px]">
            {p.cssCustomProperties.slice(0, 20).map((c, i) => (
              <div key={i} className="flex gap-2 truncate">
                <span className="text-lime shrink-0">{c.name}</span>
                <span className="text-muted-foreground truncate">{c.value}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
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
