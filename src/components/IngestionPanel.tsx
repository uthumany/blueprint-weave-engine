import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link as LinkIcon, ImageUp, Image as ImageIcon, Upload, ScanLine, ArrowRight,
  Loader2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyzeInput, AnalyzeKind } from "@/lib/useAnalyze";
import { FancyChipButton } from "./FancyChipButton";
import { listRecentSources } from "@/lib/memory/memory.functions";

type Tab = AnalyzeKind;

const tabs: { id: Tab; label: string; icon: typeof LinkIcon; hint: string; placeholder: string }[] = [
  { id: "url",         label: "URL",        icon: LinkIcon,  hint: "Paste any public website",     placeholder: "https://linear.app" },
  { id: "screenshot",  label: "Screenshot", icon: ImageUp,   hint: "Drop a PNG, JPG or WEBP",      placeholder: "" },
  { id: "image-url",   label: "Image URL",  icon: ImageIcon, hint: "Direct link to an image file", placeholder: "https://…/cover.png" },
];

const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+/i;

export function IngestionPanel({
  onAnalyze,
  onCancel,
  busy = false,
  peerId,
}: {
  onAnalyze: (kind: Tab, value: AnalyzeInput) => void;
  onCancel?: () => void;
  busy?: boolean;
  peerId?: string;
}) {
  const [tab, setTab] = useState<Tab>("url");
  const [value, setValue] = useState("");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    if (!peerId) return;
    let cancelled = false;
    listRecentSources({ data: { peerId, limit: 4 } })
      .then((r) => { if (!cancelled) setRecent(r.sources ?? []); })
      .catch(() => { /* silent */ });
    return () => { cancelled = true; };
  }, [peerId]);

  const current = tabs.find((t) => t.id === tab)!;
  const valid =
    tab === "screenshot" ? !!fileName : URL_RE.test(value.trim());

  const submit = (override?: { kind: Tab; value: AnalyzeInput }) => {
    if (busy) return;
    if (override) return onAnalyze(override.kind, override.value);
    if (!valid) return;
    onAnalyze(tab, value.trim());
  };

  const handleFile = (f: File | undefined) => {
    if (!f) return;
    setFileName(f.name);
    onAnalyze("screenshot", f);
  };

  return (
    <div id="ingest" className="glass rounded-2xl p-2 shadow-2xl scroll-mt-24">
      {/* Tab bar */}
      <div role="tablist" className="flex gap-1 p-1 bg-ink/40 rounded-xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              disabled={busy}
              onClick={() => { setTab(t.id); setValue(""); setFileName(null); }}
              className={cn(
                "relative flex-1 inline-flex items-center justify-center gap-2 px-2 sm:px-3 py-2.5 rounded-lg text-sm font-mono transition-colors disabled:opacity-50",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  className="absolute inset-0 rounded-lg bg-surface border border-border"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <Icon className="relative size-4" />
              <span className="relative tracking-tight hidden xs:inline sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input zone */}
      <div className="px-3 sm:px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3 gap-3">
          <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.18em] text-muted-foreground truncate">
            <span className="text-lime">›</span> {current.hint}
          </p>
          <span className="font-mono text-[10px] text-muted-foreground shrink-0">step_01 / ingest</span>
        </div>

        <AnimatePresence mode="wait">
          {tab === "screenshot" ? (
            <motion.label
              key="drop"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "group relative flex flex-col items-center justify-center gap-3 h-44 rounded-xl border border-dashed bg-ink/30 transition-colors cursor-pointer",
                dragging
                  ? "border-lime bg-lime/[0.06]"
                  : "border-border hover:border-lime/50 hover:bg-lime/[0.03]",
              )}
            >
              <div className="size-12 rounded-xl bg-surface border border-border grid place-items-center group-hover:border-lime/40">
                <Upload className="size-5 text-lime" />
              </div>
              <div className="text-center px-4">
                <p className="text-sm">
                  {fileName
                    ? <>Uploaded <span className="font-mono text-lime">{fileName}</span></>
                    : <>Drop a screenshot — or <span className="text-lime underline underline-offset-4">browse</span></>}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">PNG · JPG · WEBP · up to 8 MB</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </motion.label>
          ) : (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex flex-col sm:flex-row items-stretch gap-2"
            >
              <div className="flex-1 flex items-center gap-3 px-4 rounded-xl bg-ink/40 border border-border focus-within:border-lime/50 focus-within:bg-ink/60 transition-colors">
                <current.icon className="size-4 text-muted-foreground shrink-0" />
                <input
                  id="ingest-input"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={current.placeholder}
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={busy}
                  className="flex-1 h-12 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/60 disabled:opacity-60"
                  onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                />
                {value && !busy && (
                  <button
                    type="button"
                    onClick={() => setValue("")}
                    aria-label="Clear input"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
              {busy ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="group inline-flex items-center justify-center gap-2 h-12 sm:h-auto px-5 rounded-xl border border-border text-foreground font-medium text-sm hover:border-magenta/50 hover:text-magenta transition-colors"
                >
                  <Loader2 className="size-4 animate-spin" />
                  Analyzing…
                  <X className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => submit()}
                  disabled={!valid}
                  className="group inline-flex items-center justify-center gap-2 h-12 sm:h-auto px-5 rounded-xl bg-lime text-primary-foreground font-medium text-sm hover:glow-lime transition-shadow disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  <ScanLine className="size-4" />
                  Analyze
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* example chips */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-6 mt-4 pb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground self-center">try</span>
          {["linear.app", "vercel.com", "stripe.com", "loom.com"].map((s) => (
            <FancyChipButton
              key={s}
              label={s}
              hoverLabel="ANALYZE"
              hint1="Hover to preview"
              hint2="Click to analyze"
              disabled={busy}
              onClick={() => {
                setTab("url");
                const v = `https://${s}`;
                setValue(v);
                submit({ kind: "url", value: v });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
