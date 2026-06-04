import { Copy, Download, Check, Loader2, Radio } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  text: string;
  chars: number;
  tokens: number;
  included: number;
  totalSelected: number;
  truncatedAt?: string;
  building: boolean;
  progress?: { done: number; total: number; current?: string } | null;
  repoLabel: string;
  live?: boolean;
};

export function PromptPreview({
  text,
  chars,
  tokens,
  included,
  totalSelected,
  truncatedAt,
  building,
  progress,
  repoLabel,
  live = false,
}: Props) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Prompt copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Clipboard blocked — select and copy manually");
    }
  }

  function onDownload() {
    if (!text) return;
    const safe = repoLabel.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase() || "prompt";
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safe}.prompt.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl glass p-5 sm:p-6 flex flex-col min-h-[420px]">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            › prompt · {live ? "live preview" : "preview"}
          </p>
          {live && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-lime/30 bg-lime/5 font-mono text-[9px] uppercase tracking-wider text-lime">
              <Radio className="size-2.5 animate-pulse" /> live
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCopy}
            disabled={!text || live}
            title={live ? "Build prompt to enable copy" : undefined}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-border text-sm hover:border-lime/40 disabled:opacity-40"
          >
            {copied ? <Check className="size-3.5 text-lime" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={!text || live}
            title={live ? "Build prompt to enable download" : undefined}
            className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-foreground text-background text-sm font-medium hover:bg-lime hover:text-primary-foreground disabled:opacity-40"
          >
            <Download className="size-3.5" /> .md
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 flex-wrap font-mono text-[11px] text-muted-foreground/80">
        <span>
          {live ? "~" : ""}{chars.toLocaleString()} chars · ~{tokens.toLocaleString()} tokens
          {totalSelected > 0 ? ` · ${included}/${totalSelected} files` : ""}
        {truncatedAt && (
          <span className="text-amber-400/90">truncated at {truncatedAt}</span>
        )}
      </div>
        {truncatedAt && (
          <span className="text-amber-400/90">truncated at {truncatedAt}</span>
        )}
      </div>

      {building && progress && (
        <div className="mt-3">
          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-lime transition-[width] duration-200"
              style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
            />
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground inline-flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" />
            fetching {progress.done}/{progress.total}
            {progress.current ? ` · ${progress.current}` : ""}
          </p>
        </div>
      )}

      <textarea
        readOnly
        value={text}
        placeholder="Your assembled prompt will appear here after you click Build prompt."
        className="mt-4 flex-1 w-full min-h-[320px] rounded-xl bg-background/50 border border-border p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-lime/40 resize-none"
      />
    </div>
  );
}
