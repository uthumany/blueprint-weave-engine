import { Github, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";

type Props = {
  onValidated: (info: { owner: string; repo: string; branch: string }) => void;
};

export function RepoUrlInput({ onValidated }: Props) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    const { parseRepoUrl, fetchRepoInfo, GhError } = await import("@/lib/repo-prompt/github");
    const parsed = parseRepoUrl(url);
    if (!parsed) {
      setErr("Invalid GitHub URL — try https://github.com/owner/repo");
      return;
    }
    setBusy(true);
    try {
      const info = await fetchRepoInfo(parsed.owner, parsed.repo);
      if (info.private) {
        setErr("Repository is private — only public repos are supported.");
        return;
      }
      onValidated({
        owner: info.owner ?? parsed.owner,
        repo: info.repo ?? parsed.repo,
        branch: parsed.branch || info.default_branch,
      });
    } catch (e) {
      if (e instanceof GhError) {
        if (e.rateLimited && e.resetEpoch) {
          const mins = Math.max(1, Math.ceil((e.resetEpoch * 1000 - Date.now()) / 60000));
          setErr(`GitHub rate limit hit (60/hr/IP). Try again in ~${mins} min.`);
        } else if (e.status === 404) {
          setErr("Repository not found or is private.");
        } else {
          setErr(e.message);
        }
      } else {
        setErr(e instanceof Error ? e.message : "Failed to validate repo");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={go} className="rounded-2xl glass p-5 sm:p-6">
      <label className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        › repository · url
      </label>
      <div className="mt-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface/60 border border-border text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-lime/40"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 px-5 h-11 rounded-xl bg-lime text-primary-foreground font-medium hover:glow-lime transition-shadow disabled:opacity-60 disabled:cursor-wait"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          {busy ? "Scanning…" : "Scan repo"}
        </button>
      </div>
      {err && (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" /> {err}
        </p>
      )}
      <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
        Public repos only · GitHub limits unauthenticated requests to 60/hr per IP.
      </p>
    </form>
  );
}
