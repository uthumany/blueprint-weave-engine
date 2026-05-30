import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link as LinkIcon, ImageUp, Image as ImageIcon, Upload, ScanLine, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "url" | "screenshot" | "image-url";

const tabs: { id: Tab; label: string; icon: typeof LinkIcon; hint: string; placeholder: string }[] = [
  { id: "url",         label: "URL",        icon: LinkIcon,  hint: "Paste any public website",     placeholder: "https://linear.app" },
  { id: "screenshot",  label: "Screenshot", icon: ImageUp,   hint: "Drop a PNG, JPG or WEBP",      placeholder: "" },
  { id: "image-url",   label: "Image URL",  icon: ImageIcon, hint: "Direct link to an image file", placeholder: "https://…/cover.png" },
];

export function IngestionPanel({ onAnalyze }: { onAnalyze: (kind: Tab, value: string) => void }) {
  const [tab, setTab] = useState<Tab>("url");
  const [value, setValue] = useState("");

  const current = tabs.find((t) => t.id === tab)!;

  return (
    <div className="glass rounded-2xl p-2 shadow-2xl">
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
              onClick={() => { setTab(t.id); setValue(""); }}
              className={cn(
                "relative flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-mono transition-colors",
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
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
              <span className="relative tracking-tight">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Input zone */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <span className="text-lime">›</span> {current.hint}
          </p>
          <span className="font-mono text-[10px] text-muted-foreground">step_01 / ingest</span>
        </div>

        <AnimatePresence mode="wait">
          {tab === "screenshot" ? (
            <motion.label
              key="drop"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="group relative flex flex-col items-center justify-center gap-3 h-44 rounded-xl border border-dashed border-border bg-ink/30 hover:border-lime/50 hover:bg-lime/[0.03] transition-colors cursor-pointer"
            >
              <div className="size-12 rounded-xl bg-surface border border-border grid place-items-center group-hover:border-lime/40">
                <Upload className="size-5 text-lime" />
              </div>
              <div className="text-center">
                <p className="text-sm">Drop a screenshot — or <span className="text-lime underline underline-offset-4">browse</span></p>
                <p className="font-mono text-[11px] text-muted-foreground mt-1">PNG · JPG · WEBP · up to 8 MB</p>
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onAnalyze("screenshot", f.name);
                }}
              />
            </motion.label>
          ) : (
            <motion.div
              key="text"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-stretch gap-2"
            >
              <div className="flex-1 flex items-center gap-3 px-4 rounded-xl bg-ink/40 border border-border focus-within:border-lime/50 focus-within:bg-ink/60 transition-colors">
                <current.icon className="size-4 text-muted-foreground" />
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={current.placeholder}
                  className="flex-1 h-12 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/60"
                  onKeyDown={(e) => { if (e.key === "Enter" && value) onAnalyze(tab, value); }}
                />
              </div>
              <button
                onClick={() => value && onAnalyze(tab, value)}
                className="group inline-flex items-center gap-2 px-5 rounded-xl bg-lime text-primary-foreground font-medium text-sm hover:glow-lime transition-shadow"
              >
                <ScanLine className="size-4" />
                Analyze
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* example chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">try</span>
          {["linear.app", "vercel.com", "stripe.com", "loom.com"].map((s) => (
            <button
              key={s}
              onClick={() => { setTab("url"); setValue(`https://${s}`); }}
              className="font-mono text-[11px] px-2.5 py-1 rounded-md bg-surface border border-border text-muted-foreground hover:text-lime hover:border-lime/40 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
