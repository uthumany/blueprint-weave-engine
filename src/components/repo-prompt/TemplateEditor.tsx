import { useEffect, useState } from "react";
import { X, Save, RotateCcw } from "lucide-react";
import { TEMPLATES, type TemplateId } from "@/lib/repo-prompt/templates";
import { basePromptFor, type CustomTemplate } from "@/lib/repo-prompt/customTemplates";
import { toast } from "sonner";

type Props = {
  open: boolean;
  initial?: CustomTemplate | null;
  defaultBase?: TemplateId;
  onClose: () => void;
  onSave: (data: { id?: string; name: string; basedOn?: TemplateId; prompt: string }) => void;
};

// Built-in bases users typically tweak.
const BASE_OPTIONS: TemplateId[] = ["lovable", "v0", "cursor", "vibecode", "explain", "readme", "refactor"];

export function TemplateEditor({ open, initial, defaultBase, onClose, onSave }: Props) {
  const [name, setName] = useState("");
  const [basedOn, setBasedOn] = useState<TemplateId | undefined>(undefined);
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setBasedOn(initial.basedOn);
      setPrompt(initial.prompt);
    } else {
      const base = defaultBase && BASE_OPTIONS.includes(defaultBase) ? defaultBase : "lovable";
      const tpl = TEMPLATES.find((t) => t.id === base);
      setName(tpl ? `${tpl.label} (my variant)` : "My variant");
      setBasedOn(base);
      setPrompt(basePromptFor(base));
    }
  }, [open, initial, defaultBase]);

  if (!open) return null;

  function loadBase(id: TemplateId) {
    setBasedOn(id);
    setPrompt(basePromptFor(id));
  }

  function handleSave() {
    const trimmedName = name.trim();
    const trimmedPrompt = prompt.trim();
    if (!trimmedName) return toast.error("Name your variant");
    if (!trimmedPrompt) return toast.error("Prompt is empty");
    onSave({ id: initial?.id, name: trimmedName, basedOn, prompt: trimmedPrompt });
    toast.success(initial ? "Variant updated" : "Variant saved");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">
              › template · {initial ? "edit" : "new"}
            </p>
            <h3 className="text-lg font-display mt-0.5">
              {initial ? "Edit variant" : "New variant"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-border/40"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 grid gap-4 overflow-y-auto">
          <div>
            <label className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lovable — strict TDD variant"
              className="mt-1.5 w-full h-10 rounded-lg bg-background/60 border border-border px-3 text-sm focus:outline-none focus:border-lime/40"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                start from
              </label>
              {basedOn && (
                <button
                  type="button"
                  onClick={() => loadBase(basedOn)}
                  className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-lime"
                >
                  <RotateCcw className="size-3" /> reset to base
                </button>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {BASE_OPTIONS.map((id) => {
                const tpl = TEMPLATES.find((t) => t.id === id);
                if (!tpl) return null;
                const active = basedOn === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => loadBase(id)}
                    className={
                      "px-2.5 h-7 rounded-md border text-xs transition-colors " +
                      (active
                        ? "border-lime/60 bg-lime/10 text-lime"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-lime/30")
                    }
                  >
                    {tpl.label.split("(")[0].trim()}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1.5 w-full min-h-[280px] rounded-lg bg-background/60 border border-border p-3 text-xs font-mono leading-relaxed focus:outline-none focus:border-lime/40 resize-y"
            />
            <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
              {prompt.length.toLocaleString()} chars · repository files are appended after this prompt.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-3 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-lime text-primary-foreground text-sm font-medium hover:glow-lime"
          >
            <Save className="size-3.5" /> Save variant
          </button>
        </div>
      </div>
    </div>
  );
}
