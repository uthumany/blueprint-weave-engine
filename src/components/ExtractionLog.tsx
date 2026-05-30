import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

const LINES = [
  { t: "00.00", c: "GET screenshot · microlink.io", k: "ok" },
  { t: "00.42", c: "parse DOM → 1284 nodes", k: "ok" },
  { t: "00.71", c: "extract computed CSS · 312 rules", k: "ok" },
  { t: "01.04", c: "detect font-face · Geist, Inter", k: "ok" },
  { t: "01.38", c: "handoff → claude-sonnet-4 (vision)", k: "warn" },
  { t: "02.10", c: "color system · 7 tokens resolved", k: "ok" },
  { t: "02.55", c: "spacing scale · base 4px detected", k: "ok" },
  { t: "03.12", c: "effects · backdrop-filter:blur(24px)", k: "ok" },
  { t: "03.84", c: "mood tags · [futuristic, minimal, dark]", k: "ok" },
  { t: "04.20", c: "profile.dna.json ✓ saved", k: "done" },
];

export function ExtractionLog() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= LINES.length) {
      const r = setTimeout(() => setShown(0), 2200);
      return () => clearTimeout(r);
    }
    const t = setTimeout(() => setShown((s) => s + 1), 380);
    return () => clearTimeout(t);
  }, [shown]);

  return (
    <div className="glass rounded-2xl overflow-hidden scanline">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-ink/40">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-lime" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">extraction.log</span>
        </div>
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-lime animate-pulse-dot" />
        </div>
      </div>
      <div className="p-4 font-mono text-[12px] leading-relaxed min-h-[260px]">
        {LINES.slice(0, shown).map((l, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-muted-foreground/60">{l.t}</span>
            <span className={
              l.k === "ok"   ? "text-foreground/85" :
              l.k === "warn" ? "text-magenta" :
              "text-lime"
            }>
              {l.k === "done" ? "✓ " : "› "}{l.c}
            </span>
          </div>
        ))}
        {shown < LINES.length && (
          <span className="inline-block size-2 bg-lime animate-pulse-dot align-middle ml-1" />
        )}
      </div>
    </div>
  );
}
