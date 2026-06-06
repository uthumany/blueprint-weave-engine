import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { ArrowLeft, Wand2, Component, FileJson, Sparkles, Loader2, Download, Copy, Check, AlertTriangle } from "lucide-react";
import { useState, useRef, useCallback } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ProfilePreview } from "@/components/ProfilePreview";
import { loadProfiles } from "@/lib/profileStore";
import type { DnaProfile } from "@/lib/useAnalyze";
import { toast } from "sonner";

type SearchParams = { profile?: string };

export const Route = createFileRoute("/generate")({
  head: () => ({
    meta: [
      { title: "Generate — NOTEPADIFY" },
      { name: "description", content: "Compose pixel-faithful UIs from a saved design profile and your own content." },
    ],
  }),
  validateSearch: (search: Record<string, string | undefined>): SearchParams => ({
    profile: search.profile,
  }),
  component: GeneratePage,
});

function GeneratePage() {
  const { profile: urlProfile } = useSearch({ from: Route.id });
  const [activeProfile, setActiveProfile] = useState<DnaProfile | null>(() => {
    if (urlProfile) {
      try { return JSON.parse(urlProfile) as DnaProfile; } catch { return null; }
    }
    return null;
  });
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [content, setContent] = useState("# Welcome\n\nYour content goes here.\n\n## Features\n\n- Feature one\n- Feature two\n- Feature three\n\nGet started by editing this text.");
  const [generating, setGenerating] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const allProfiles = loadProfiles();

  const handleProfileSelect = (id: string) => {
    setSelectedProfileId(id);
    setHtml(null);
    setStreamText("");
    setError(null);
    const found = allProfiles.find((p) => p.id === id);
    if (found) setActiveProfile(found.profile);
  };

  const pickFromLibrary = useCallback(() => {
    const ids = allProfiles.map((p) => p.id);
    if (ids.length === 0) {
      toast.error("No saved profiles yet — analyze a website first.");
      return;
    }
    // Cycle through profiles
    const currentIdx = ids.indexOf(selectedProfileId);
    const nextIdx = (currentIdx + 1) % ids.length;
    handleProfileSelect(ids[nextIdx]);
    toast.success(`Loaded: ${allProfiles.find((p) => p.id === ids[nextIdx])?.label}`);
  }, [allProfiles, selectedProfileId]);

  const generate = async () => {
    if (!activeProfile) {
      toast.error("Select or paste a profile first.");
      return;
    }
    if (!content.trim()) {
      toast.error("Write some content to render.");
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setGenerating(true);
    setHtml(null);
    setStreamText("");
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: JSON.stringify(activeProfile), content }),
        signal: ctrl.signal,
      });

      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(`Generate failed (${res.status}) ${t.slice(0, 160)}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let fullHtml = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n\n")) !== -1) {
          const evt = buf.slice(0, nl);
          buf = buf.slice(nl + 2);
          for (const raw of evt.split("\n")) {
            if (!raw.startsWith("data: ")) continue;
            try {
              const msg = JSON.parse(raw.slice(6));
              if (msg.type === "chunk") {
                setStreamText((prev) => prev + msg.text);
              } else if (msg.type === "result") {
                fullHtml = msg.html;
                setHtml(msg.html);
                setStreamText("");
                toast.success("HTML generated!");
              } else if (msg.type === "error") {
                setError(msg.message);
              } else if (msg.type === "done") {
                setGenerating(false);
              }
            } catch { /* skip */ }
          }
        }
      }
      setGenerating(false);
      if (fullHtml && iframeRef.current) {
        iframeRef.current.srcdoc = fullHtml;
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
      setGenerating(false);
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
    setGenerating(false);
  };

  const downloadHtml = () => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "notepadify-output.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyHtml = async () => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("HTML copied!");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <SiteHeader />

      <section className="relative container-page pt-12 sm:pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-lime transition-colors">
          <ArrowLeft className="size-3" /> back
        </Link>

        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime mt-8">› the composer</p>
        <h1 className="font-display text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.95] tracking-tight mt-3">
          Compose with <em className="text-lime not-italic">DNA</em>.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground leading-relaxed">
          Drop a profile, paste your content, and stream a single-file HTML page styled exactly like the reference.
        </p>

        <div className="mt-12 grid lg:grid-cols-[1fr_1.2fr] gap-8">
          {/* Left — profile + content */}
          <div className="space-y-6">
            {/* Profile selector */}
            <div className="rounded-2xl glass p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">profile · source</p>
              <div className="mt-3 space-y-3">
                {allProfiles.length > 0 && (
                  <select
                    value={selectedProfileId}
                    onChange={(e) => handleProfileSelect(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 font-mono text-sm text-foreground outline-none focus:border-lime/40"
                  >
                    <option value="">Pick a saved profile…</option>
                    {allProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label} · {new Date(p.analyzedAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={pickFromLibrary}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-lime hover:underline"
                >
                  <FileJson className="size-3" /> {allProfiles.length > 0 ? "cycle through profiles" : "no saved profiles — analyze first"}
                </button>
              </div>

              {activeProfile && (
                <div className="mt-4">
                  <ProfilePreview profile={activeProfile} />
                </div>
              )}

              {/* Profile paste fallback */}
              {!activeProfile && (
                <div className="mt-4 rounded-xl border border-dashed border-border p-5 text-center">
                  <FileJson className="size-6 mx-auto text-muted-foreground" />
                  <p className="font-mono text-xs text-muted-foreground mt-3">
                    Paste a profile URL parameter, or load from <Link to="/profiles" className="text-lime hover:underline">profiles</Link>
                  </p>
                </div>
              )}
            </div>

            {/* Content editor */}
            <div className="rounded-2xl glass p-5">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">your · content</p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="mt-3 w-full h-52 rounded-xl bg-surface/60 border border-border p-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-lime/40 resize-none"
              />
            </div>

            {/* Generate button */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={generating ? cancel : generate}
                disabled={!activeProfile && !generating}
                className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-lime text-primary-foreground font-medium hover:glow-lime transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Icon3d name="Wand2" size={18} /> Generate page <Sparkles className="size-3.5 opacity-70" />
                  </>
                )}
                {generating ? "Generating…" : ""}
              </button>

              {html && (
                <>
                  <button
                    type="button"
                    onClick={downloadHtml}
                    className="inline-flex items-center gap-1.5 px-3 h-10 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Download className="size-4" /> .html
                  </button>
                  <button
                    type="button"
                    onClick={copyHtml}
                    className="inline-flex items-center gap-1.5 px-3 h-10 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground"
                  >
                    {copied ? <Icon3d name="Check" size={16} className="text-lime" /> : <Icon3d name="Copy" size={16} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 px-3 py-2 rounded-lg border border-magenta/40 bg-magenta/[0.06] font-mono text-[11px] text-magenta">
                <AlertTriangle className="size-3.5 mt-0.5 shrink-0" />
                <span className="break-all">{error}</span>
              </div>
            )}

            {generating && streamText && (
              <div className="rounded-xl border border-border bg-surface/40 p-3 max-h-32 overflow-y-auto">
                <p className="font-mono text-[10px] text-muted-foreground">streaming generation…</p>
                <p className="font-mono text-[11px] text-lime/80 mt-1 break-all line-clamp-4">{streamText.slice(-300)}</p>
              </div>
            )}
          </div>

          {/* Right — preview */}
          <div className="rounded-2xl glass p-0 overflow-hidden min-h-[420px] flex flex-col">
            {html ? (
              <iframe
                ref={iframeRef}
                srcDoc={html}
                className="w-full flex-1 bg-white"
                title="Generated preview"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <Component className="size-8 mx-auto text-muted-foreground" />
                  <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground mt-4">
                    {generating ? "generating…" : "preview · pending"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs">
                    {generating
                      ? "Streaming your pixel-faithful HTML page…"
                      : "Select a profile, write content, and hit Generate."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
