import { useEffect, useRef, useState } from "react";
import { Terminal } from "lucide-react";

export type LogLine = { t: string; c: string; k: "ok" | "warn" | "done" };

const DEMO: LogLine[] = [
  { t: "00.00", c: "GET screenshot · microlink.io", k: "ok" },
  { t: "00.42", c: "parse DOM → 1284 nodes", k: "ok" },
  { t: "00.71", c: "extract computed CSS · 312 rules", k: "ok" },
  { t: "01.04", c: "detect font-face · Geist, Inter", k: "ok" },
  { t: "01.38", c: "handoff → gemini-2.5-pro (vision)", k: "warn" },
  { t: "02.10", c: "color system · 7 tokens resolved", k: "ok" },
  { t: "02.55", c: "spacing scale · base 4px detected", k: "ok" },
  { t: "03.12", c: "effects · backdrop-filter:blur(24px)", k: "ok" },
  { t: "03.84", c: "mood tags · [futuristic, minimal, dark]", k: "ok" },
  { t: "04.20", c: "profile.dna.json ✓ saved", k: "done" },
];

export function ExtractionLog({
  lines,
  live,
  tokenCount,
}: {
  lines?: LogLine[];
  live?: boolean;
  tokenCount?: number;
}) {
  const controlled = Array.isArray(lines);
  const [shown, setShown] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (controlled) return;
    if (shown >= DEMO.length) {
      const r = setTimeout(() => setShown(0), 2200);
      return () => clearTimeout(r);
    }
    const t = setTimeout(() => setShown((s) => s + 1), 380);
    return () => clearTimeout(t);
  }, [shown, controlled]);

  const visible = controlled ? lines! : DEMO.slice(0, shown);
  const showCursor = controlled ? !!live : shown < DEMO.length;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [visible.length, tokenCount]);

  return (
    <div className="glass rounded-2xl overflow-hidden scanline">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-ink/40">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-lime" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            extraction.log {controlled && live ? "· live" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {typeof tokenCount === "number" && tokenCount > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground">
              {tokenCount.toLocaleString()} chars
            </span>
          )}
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className="size-2 rounded-full bg-muted-foreground/30" />
          <span className={`size-2 rounded-full ${showCursor ? "bg-lime animate-pulse-dot" : "bg-muted-foreground/30"}`} />
        </div>
      </div>
      <div
        ref={scrollRef}
        className="p-4 font-mono text-[12px] leading-relaxed min-h-[260px] max-h-[320px] overflow-y-auto"
      >
        {visible.map((l, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-muted-foreground/60">{l.t}</span>
            <span
              className={
                l.k === "ok"
                  ? "text-foreground/85"
                  : l.k === "warn"
                  ? "text-magenta"
                  : "text-lime"
              }
            >
              {l.k === "done" ? "✓ " : "› "}
              {l.c}
            </span>
          </div>
        ))}
        {showCursor && (
          <span className="inline-block size-2 bg-lime animate-pulse-dot align-middle ml-1" />
        )}
      </div>
    </div>
  );
}
