import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Github, Sparkles, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { RepoUrlInput } from "@/components/repo-prompt/RepoUrlInput";
import { FileTree } from "@/components/repo-prompt/FileTree";
import { TemplatePicker } from "@/components/repo-prompt/TemplatePicker";
import { PromptPreview } from "@/components/repo-prompt/PromptPreview";
import {
  fetchTree,
} from "@/lib/repo-prompt/github";
import {
  assemblePrompt,
  autoSelectSignals,
  fetchFilesBatched,
  filterTree,
  type AggregateProgress,
  type FileEntry,
} from "@/lib/repo-prompt/aggregate";
import { getTemplatePrompt, SYSTEM_BLOCK, type TemplateId } from "@/lib/repo-prompt/templates";
import { useCustomTemplates } from "@/lib/repo-prompt/customTemplates";
import { toast } from "sonner";

export const Route = createFileRoute("/repo-to-prompt")({
  head: () => ({
    meta: [
      { title: "Repo → Prompt — Design DNA" },
      {
        name: "description",
        content:
          "Turn any public GitHub repository into a structured, copy-ready AI prompt. No login, no backend.",
      },
      { property: "og:title", content: "Repo → Prompt — Design DNA" },
      {
        property: "og:description",
        content: "Paste a GitHub URL, pick files, ship a prompt to ChatGPT or Claude.",
      },
    ],
  }),
  component: RepoToPromptPage,
});

type Repo = { owner: string; repo: string; branch: string };

function RepoToPromptPage() {
  const [repo, setRepo] = useState<Repo | null>(null);
  const [loadingTree, setLoadingTree] = useState(false);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [treeTruncated, setTreeTruncated] = useState(false);

  const [template, setTemplate] = useState<TemplateId>("lovable");
  const [custom, setCustom] = useState("");
  const [maxChars, setMaxChars] = useState(40_000);
  const { variants } = useCustomTemplates();

  const [building, setBuilding] = useState(false);
  const [progress, setProgress] = useState<AggregateProgress | null>(null);
  const [output, setOutput] = useState({
    text: "",
    chars: 0,
    tokens: 0,
    included: 0,
    truncatedAt: undefined as string | undefined,
  });
  const abortRef = useRef<AbortController | null>(null);

  async function onValidated(info: Repo) {
    setRepo(info);
    setTreeError(null);
    setLoadingTree(true);
    setFiles([]);
    try {
      const { tree, truncated } = await fetchTree(info.owner, info.repo, info.branch);
      setTreeTruncated(truncated);
      const filtered = filterTree(tree);
      setFiles(autoSelectSignals(filtered));
    } catch (e) {
      setTreeError(e instanceof Error ? e.message : "Failed to load file tree");
    } finally {
      setLoadingTree(false);
    }
  }

  function toggle(path: string) {
    setFiles((prev) => prev.map((f) => (f.path === path ? { ...f, selected: !f.selected } : f)));
  }

  function bulk(mode: "signals" | "all" | "none") {
    setFiles((prev) => {
      if (mode === "all") return prev.map((f) => ({ ...f, selected: true }));
      if (mode === "none") return prev.map((f) => ({ ...f, selected: false }));
      return autoSelectSignals(prev);
    });
  }

  async function build() {
    if (!repo) return;
    const selected = files.filter((f) => f.selected);
    if (selected.length === 0) {
      toast.error("Select at least one file");
      return;
    }
    const templatePrompt = getTemplatePrompt(template, custom);
    if (template === "custom" && !templatePrompt) {
      toast.error("Custom instruction is empty");
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBuilding(true);
    setProgress({ done: 0, total: selected.length });
    setOutput({ text: "", chars: 0, tokens: 0, included: 0, truncatedAt: undefined });

    try {
      const fetched = await fetchFilesBatched(
        repo.owner,
        repo.repo,
        repo.branch,
        selected.map((f) => f.path),
        8,
        (p) => setProgress(p),
        ctrl.signal,
      );
      if (ctrl.signal.aborted) return;
      const result = assemblePrompt({
        templatePrompt,
        systemBlock: SYSTEM_BLOCK,
        repoLabel: `${repo.owner}/${repo.repo}@${repo.branch}`,
        files: fetched,
        maxChars,
      });
      setOutput({
        text: result.text,
        chars: result.chars,
        tokens: result.tokens,
        included: result.included,
        truncatedAt: result.truncatedAt,
      });
      toast.success(`Prompt ready · ${result.chars.toLocaleString()} chars`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Build failed");
    } finally {
      setBuilding(false);
      setProgress(null);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setRepo(null);
    setFiles([]);
    setOutput({ text: "", chars: 0, tokens: 0, included: 0, truncatedAt: undefined });
    setTreeError(null);
    setTreeTruncated(false);
  }

  const selectedCount = files.filter((f) => f.selected).length;
  const repoLabel = repo ? `${repo.owner}/${repo.repo}` : "";

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <SiteHeader />

      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-24">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-lime transition-colors"
        >
          <ArrowLeft className="size-3" /> back
        </Link>

        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime mt-8">
          › repo → prompt
        </p>
        <h1 className="font-display text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.95] tracking-tight mt-3">
          Any repo, <em className="text-lime not-italic">one prompt</em>.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground leading-relaxed">
          Paste a public GitHub URL. We fetch the file tree, you pick what matters, and we assemble
          a ready-to-paste prompt for ChatGPT, Claude, or anywhere else.
        </p>

        <div className="mt-10 grid gap-6">
          <RepoUrlInput onValidated={onValidated} />

          <AnimatePresence>
            {repo && (
              <motion.div
                key="repo-header"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-border bg-surface/40 px-4 py-3"
              >
                <a
                  href={`https://github.com/${repo.owner}/${repo.repo}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm hover:text-lime transition-colors"
                >
                  <Github className="size-4" />
                  <span className="font-mono">
                    {repo.owner}/<span className="text-foreground font-medium">{repo.repo}</span>
                    <span className="text-muted-foreground"> @ {repo.branch}</span>
                  </span>
                </a>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 px-2.5 h-8 rounded-md border border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3" /> change repo
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {loadingTree && (
            <div className="rounded-2xl glass p-8 grid place-items-center">
              <Loader2 className="size-5 animate-spin text-lime" />
              <p className="mt-3 font-mono text-xs text-muted-foreground">scanning tree…</p>
            </div>
          )}

          {treeError && (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm text-destructive">
              {treeError}
            </div>
          )}

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid gap-6 lg:grid-cols-[1.1fr_1fr]"
              >
                <FileTree files={files} onToggle={toggle} onBulk={bulk} />
                <div className="grid gap-6">
                  <TemplatePicker
                    value={template}
                    custom={custom}
                    onChange={setTemplate}
                    onCustomChange={setCustom}
                    maxChars={maxChars}
                    onMaxCharsChange={setMaxChars}
                  />
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={build}
                      disabled={building || selectedCount === 0}
                      className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-lime text-primary-foreground font-medium hover:glow-lime transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {building ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Sparkles className="size-4" />
                      )}
                      {building ? "Building…" : "Build prompt"}
                    </button>
                    {building && (
                      <button
                        type="button"
                        onClick={() => abortRef.current?.abort()}
                        className="inline-flex items-center gap-1.5 px-3 h-10 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    )}
                    {treeTruncated && (
                      <span className="font-mono text-[11px] text-amber-400/90">
                        tree truncated by GitHub — very large repo
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {(output.text || building) && (
            <PromptPreview
              text={output.text}
              chars={output.chars}
              tokens={output.tokens}
              included={output.included}
              totalSelected={selectedCount}
              truncatedAt={output.truncatedAt}
              building={building}
              progress={progress}
              repoLabel={repoLabel}
            />
          )}
        </div>
      </section>
    </div>
  );
}
