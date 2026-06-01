import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, Camera, Send, Brain, Sparkles, FileCheck2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhaseId, PhaseState } from "@/lib/useAnalyze";

const STEPS: { id: PhaseId; label: string; icon: typeof Camera }[] = [
  { id: "capture", label: "Capture", icon: Camera },
  { id: "handoff", label: "Handoff", icon: Send },
  { id: "thinking", label: "Reason", icon: Brain },
  { id: "streaming", label: "Stream", icon: Sparkles },
  { id: "parsing", label: "Parse", icon: FileCheck2 },
  { id: "done", label: "Ready", icon: CheckCircle2 },
];

function formatElapsed(ms: number) {
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}m ${r}s`;
}

export function AnalysisProgress({
  live,
  phase,
  elapsedMs,
  tokens,
}: {
  live: boolean;
  phase: PhaseState | null;
  elapsedMs: number;
  tokens: number;
}) {
  // Local clock keeps elapsed moving smoothly between server ticks
  const [now, setNow] = useState(elapsedMs);
  useEffect(() => {
    if (!live) { setNow(elapsedMs); return; }
    setNow(elapsedMs);
    const start = Date.now() - elapsedMs;
    const id = setInterval(() => setNow(Date.now() - start), 100);
    return () => clearInterval(id);
  }, [live, elapsedMs]);

  if (!phase && !live) return null;

  const currentIdx = phase ? STEPS.findIndex((s) => s.id === phase.id) : 0;
  const pct = phase?.pct ?? 0;

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 mb-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          {live ? (
            <Loader2 className="size-3.5 text-lime animate-spin shrink-0" />
          ) : (
            <Check className="size-3.5 text-lime shrink-0" />
          )}
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground truncate">
            {phase?.label ?? "Preparing"}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground shrink-0">
          <span>{formatElapsed(now)}</span>
          <span className="text-foreground/70">{tokens.toLocaleString()} chars</span>
          <span className="text-lime">{Math.round(pct)}%</span>
        </div>
      </div>

      {/* progress bar */}
      <div className="relative h-1.5 rounded-full bg-ink/60 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-lime"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: "spring", stiffness: 90, damping: 22 }}
        />
        {live && (
          <motion.div
            className="absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-lime/40 to-transparent"
            animate={{ x: ["-25%", "400%"] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* step rail */}
      <ol className="mt-4 grid grid-cols-6 gap-1">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < currentIdx || phase?.id === "done";
          const active = i === currentIdx && phase?.id !== "done";
          return (
            <li key={s.id} className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "relative size-7 rounded-lg border grid place-items-center transition-colors",
                  done && "bg-lime/15 border-lime/40 text-lime",
                  active && "border-lime text-lime",
                  !done && !active && "border-border text-muted-foreground/60",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="progress-halo"
                    className="absolute inset-0 rounded-lg ring-1 ring-lime/50 ring-offset-1 ring-offset-background"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                {done ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
              </div>
              <span
                className={cn(
                  "font-mono text-[9px] uppercase tracking-[0.14em] truncate w-full text-center",
                  active ? "text-foreground" : "text-muted-foreground/70",
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
