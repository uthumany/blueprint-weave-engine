import { useState } from "react";
import { TEMPLATES, type TemplateId, type BuiltinTemplateId } from "@/lib/repo-prompt/templates";
import { useCustomTemplates, type CustomTemplate } from "@/lib/repo-prompt/customTemplates";
import { TemplateEditor } from "./TemplateEditor";
import {
  BookOpen,
  FileText,
  Wrench,
  Pencil,
  Sparkles,
  Heart,
  Zap,
  TerminalSquare,
  Plus,
  Trash2,
  Bookmark,
} from "lucide-react";

const ICONS: Record<BuiltinTemplateId, typeof BookOpen> = {
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
  const { variants, upsertVariant, removeVariant } = useCustomTemplates();
  const [editor, setEditor] = useState<{ open: boolean; initial: CustomTemplate | null }>({
    open: false,
    initial: null,
  });

  // Determine "base" for new variants from the currently selected built-in.
  const defaultBase: BuiltinTemplateId | undefined =
    value !== "custom" && TEMPLATES.some((t) => t.id === value) ? (value as BuiltinTemplateId) : "lovable";

  function openNew() {
    setEditor({ open: true, initial: null });
  }
  function openEdit(v: CustomTemplate) {
    setEditor({ open: true, initial: v });
  }
  function handleSave(data: { id?: string; name: string; basedOn?: TemplateId; prompt: string }) {
    const saved = upsertVariant({
      id: data.id,
      name: data.name,
      basedOn: data.basedOn as BuiltinTemplateId | undefined,
      prompt: data.prompt,
    });
    onChange(saved.id);
  }
  function handleDelete(v: CustomTemplate, e: React.MouseEvent) {
    e.stopPropagation();
    removeVariant(v.id);
    if (value === v.id) onChange("lovable");
  }

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
            <span className="font-medium text-sm">Custom instruction (one-off)</span>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Write a quick prompt below — not saved. For reusable tweaks, create a variant.
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

      <div className="mt-6 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          › my variants
        </p>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-lime hover:border-lime/40"
        >
          <Plus className="size-3" /> new variant
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground/70 italic">
          No saved variants yet. Start from a built-in template and tweak it to fit your workflow.
        </p>
      ) : (
        <div className="mt-2 grid gap-2">
          {variants.map((v) => {
            const active = value === v.id;
            const baseLabel = v.basedOn
              ? TEMPLATES.find((t) => t.id === v.basedOn)?.label.split("(")[0].trim()
              : null;
            return (
              <div
                key={v.id}
                className={
                  "group rounded-xl border p-3 transition-colors " +
                  (active
                    ? "border-lime/60 bg-lime/5"
                    : "border-border hover:border-lime/30 bg-surface/40")
                }
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => onChange(v.id)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark className={`size-4 ${active ? "text-lime" : "text-muted-foreground"}`} />
                      <span className="font-medium text-sm truncate">{v.name}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {baseLabel ? `based on ${baseLabel} · ` : ""}
                      {v.prompt.length.toLocaleString()} chars
                    </p>
                  </button>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(v);
                      }}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-border/40"
                      aria-label="Edit variant"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(v, e)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-border/40"
                      aria-label="Delete variant"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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

      <TemplateEditor
        open={editor.open}
        initial={editor.initial}
        defaultBase={defaultBase}
        onClose={() => setEditor({ open: false, initial: null })}
        onSave={handleSave}
      />
    </div>
  );
}
