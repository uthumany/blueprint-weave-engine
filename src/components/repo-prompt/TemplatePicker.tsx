import { TEMPLATES, type TemplateId } from "@/lib/repo-prompt/templates";
import { BookOpen, FileText, Wrench, Pencil, Sparkles, Heart, Zap, TerminalSquare } from "lucide-react";

const ICONS: Record<TemplateId, typeof BookOpen> = {
  vibecode: Sparkles,
  lovable: Heart,
  v0: Zap,
  cursor: TerminalSquare,
  explain: BookOpen,
  readme: FileText,
  refactor: Wrench,
  custom: Pencil,
};

type Props = {
  value: TemplateId;
  custom: string;
  onChange: (id: TemplateId) => void;
  onCustomChange: (s: string) => void;
  maxChars: number;
  onMaxCharsChange: (n: number) => void;
};

export function TemplatePicker({
  value,
  custom,
  onChange,
  onCustomChange,
  maxChars,
  onMaxCharsChange,
}: Props) {
  return (
    <div className="rounded-2xl glass p-5 sm:p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        › prompt · template
      </p>

      <div className="mt-4 grid sm:grid-cols-2 gap-2">
        {TEMPLATES.map((t) => {
          const Icon = ICONS[t.id];
          const active = value === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.id)}
              className={
                "text-left rounded-xl border p-3 transition-colors " +
                (active
                  ? "border-lime/60 bg-lime/5"
                  : "border-border hover:border-lime/30 bg-surface/40")
              }
            >
              <div className="flex items-center gap-2">
                <Icon className={`size-4 ${active ? "text-lime" : "text-muted-foreground"}`} />
                <span className="font-medium text-sm">{t.label}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{t.description}</p>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => onChange("custom")}
          className={
            "text-left rounded-xl border p-3 transition-colors sm:col-span-2 " +
            (value === "custom"
              ? "border-lime/60 bg-lime/5"
              : "border-border hover:border-lime/30 bg-surface/40")
          }
        >
          <div className="flex items-center gap-2">
            <Pencil className={`size-4 ${value === "custom" ? "text-lime" : "text-muted-foreground"}`} />
            <span className="font-medium text-sm">Custom instruction</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Write your own prompt — repo contents are appended below it.
          </p>
        </button>
      </div>

      {value === "custom" && (
        <textarea
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          placeholder="e.g. Review this codebase for security issues and list them by severity…"
          className="mt-3 w-full h-28 rounded-xl bg-surface/60 border border-border p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-lime/40 resize-none"
        />
      )}

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <label className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            › char budget
          </label>
          <span className="font-mono text-xs text-foreground">
            {maxChars.toLocaleString()} · ~{Math.ceil(maxChars / 4).toLocaleString()} tokens
          </span>
        </div>
        <input
          type="range"
          min={10000}
          max={200000}
          step={5000}
          value={maxChars}
          onChange={(e) => onMaxCharsChange(Number(e.target.value))}
          className="mt-2 w-full accent-lime"
        />
      </div>
    </div>
  );
}
