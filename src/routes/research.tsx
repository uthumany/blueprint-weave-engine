import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Search, FileText, Code, Image as ImageIcon, Camera, Map, Globe, Loader2, Copy, Check, Download, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import {
  ctxWebSearch, ctxScrapeMarkdown, ctxScrapeHtml, ctxScrapeImages,
  ctxScreenshot, ctxCrawlSite, ctxCrawlSitemap,
} from "@/lib/context/context.functions";

export const Route = createFileRoute("/research")({
  head: () => ({
    meta: [
      { title: "Research · NOTEPADIFY" },
      { name: "description", content: "Crawl sites, search the web, scrape markdown or HTML, extract images, capture screenshots — powered by Context.dev." },
      { property: "og:title", content: "Research · NOTEPADIFY" },
      { property: "og:description", content: "One-tap web scraping, search, and screenshots inside NOTEPADIFY." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResearchPage,
});

type Tool = "search" | "markdown" | "html" | "images" | "screenshot" | "sitemap" | "crawl";

const TOOLS: { id: Tool; label: string; icon: typeof Search; hint: string; placeholder: string }[] = [
  { id: "search",     label: "Web Search",       icon: Search,    hint: "Search the web (ranked, LLM-ready)", placeholder: "vector database benchmarks 2024" },
  { id: "markdown",   label: "Scrape Markdown",  icon: FileText,  hint: "One URL → clean markdown",           placeholder: "https://example.com" },
  { id: "html",       label: "Scrape HTML",      icon: Code,      hint: "Rendered HTML of any URL",           placeholder: "https://example.com" },
  { id: "images",     label: "Scrape Images",    icon: ImageIcon, hint: "Every image on a page",              placeholder: "https://example.com" },
  { id: "screenshot", label: "Screenshot",       icon: Camera,    hint: "Capture URL as PNG",                 placeholder: "https://example.com" },
  { id: "sitemap",    label: "Crawl Sitemap",    icon: Map,       hint: "Discover every URL from sitemap",    placeholder: "example.com" },
  { id: "crawl",      label: "Crawl Site",       icon: Globe,     hint: "Recursive markdown crawl",           placeholder: "https://example.com" },
];

function ResearchPage() {
  const [tool, setTool] = useState<Tool>("search");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const current = TOOLS.find((t) => t.id === tool)!;

  async function run() {
    if (!input.trim() || busy) return;
    setBusy(true); setError(null); setResult(null);
    try {
      let r;
      switch (tool) {
        case "search":     r = await ctxWebSearch({ data: { query: input.trim() } }); break;
        case "markdown":   r = await ctxScrapeMarkdown({ data: { url: input.trim() } }); break;
        case "html":       r = await ctxScrapeHtml({ data: { url: input.trim() } }); break;
        case "images":     r = await ctxScrapeImages({ data: { url: input.trim() } }); break;
        case "screenshot": r = await ctxScreenshot({ data: { target: input.trim() } }); break;
        case "sitemap":    r = await ctxCrawlSitemap({ data: { domain: input.trim() } }); break;
        case "crawl":      r = await ctxCrawlSite({ data: { url: input.trim() } }); break;
      }
      if (!r?.ok) setError(r?.error ?? "Request failed");
      else setResult(r.data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container-page py-10">
        <header className="mb-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-lime">context.dev · workbench</p>
          <h1 className="font-display text-3xl sm:text-4xl mt-2">Research</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Seven tools for pulling clean, LLM-ready web data. Results persist to your memory for future analyses.
          </p>
        </header>

        <div className="glass rounded-2xl p-2">
          <div className="flex gap-1 p-1 bg-ink/40 rounded-xl overflow-x-auto">
            {TOOLS.map((t) => {
              const Icon = t.icon;
              const active = t.id === tool;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setTool(t.id); setInput(""); setResult(null); setError(null); }}
                  className={"inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-colors " + (active ? "bg-surface text-foreground border border-border" : "text-muted-foreground hover:text-foreground")}
                >
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              <span className="text-lime">›</span> {current.hint}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={current.placeholder}
                disabled={busy}
                onKeyDown={(e) => { if (e.key === "Enter") run(); }}
                className="flex-1 h-11 px-4 rounded-xl bg-ink/40 border border-border text-sm font-mono focus:outline-none focus:border-lime/50"
              />
              <button
                type="button"
                onClick={run}
                disabled={busy || !input.trim()}
                className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-lime text-primary-foreground font-medium text-sm hover:glow-lime transition-shadow disabled:opacity-40"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <current.icon className="size-4" />}
                {busy ? "Running…" : "Run"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-xl border border-magenta/40 bg-magenta/[0.06] font-mono text-xs text-magenta break-all">
            error · {error}
          </div>
        )}

        {result && (
          <div className="mt-4 glass rounded-2xl p-4 sm:p-5">
            <ResultView tool={tool} data={result} />
          </div>
        )}
      </main>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ResultView({ tool, data }: { tool: Tool; data: any }) {
  if (tool === "screenshot") {
    const src = data?.screenshot ?? data?.image ?? data?.url;
    return src ? (
      <img src={src} alt="screenshot" className="w-full rounded-lg border border-border" />
    ) : <RawJson data={data} />;
  }
  if (tool === "images") {
    const imgs: string[] = (data?.images ?? []).map((x: { url?: string; src?: string } | string) =>
      typeof x === "string" ? x : (x.url ?? x.src ?? "")
    ).filter(Boolean);
    return imgs.length ? (
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {imgs.slice(0, 40).map((u, i) => (
          <a key={i} href={u} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden border border-border bg-ink/40">
            <img src={u} alt="" className="w-full h-full object-cover" loading="lazy" />
          </a>
        ))}
      </div>
    ) : <RawJson data={data} />;
  }
  if (tool === "sitemap") {
    const urls: string[] = data?.urls ?? data?.sitemap ?? [];
    return urls.length ? (
      <ul className="space-y-1 max-h-[520px] overflow-auto font-mono text-xs">
        {urls.slice(0, 500).map((u, i) => (
          <li key={i}><a href={u} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-lime">{u}</a></li>
        ))}
      </ul>
    ) : <RawJson data={data} />;
  }
  if (tool === "search") {
    const results = data?.results ?? [];
    return results.length ? (
      <ul className="space-y-3">
        {results.map((r: { title?: string; url?: string; snippet?: string; description?: string }, i: number) => (
          <li key={i} className="border border-border rounded-lg p-3 bg-ink/30">
            <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-foreground hover:text-lime font-medium">{r.title ?? r.url}</a>
            <p className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">{r.url}</p>
            {(r.snippet ?? r.description) && <p className="text-xs text-muted-foreground mt-1">{r.snippet ?? r.description}</p>}
          </li>
        ))}
      </ul>
    ) : <RawJson data={data} />;
  }
  if (tool === "markdown") {
    return (
      <pre className="whitespace-pre-wrap text-xs font-mono text-muted-foreground max-h-[520px] overflow-auto">
        {data?.markdown ?? JSON.stringify(data, null, 2)}
      </pre>
    );
  }
  if (tool === "html") {
    return (
      <pre className="whitespace-pre-wrap text-xs font-mono text-muted-foreground max-h-[520px] overflow-auto">
        {(data?.html ?? "").slice(0, 200_000) || JSON.stringify(data, null, 2)}
      </pre>
    );
  }
  if (tool === "crawl") {
    const pages = data?.pages ?? [];
    return pages.length ? (
      <div className="space-y-3 max-h-[600px] overflow-auto">
        {pages.map((p: { url?: string; markdown?: string; title?: string }, i: number) => (
          <details key={i} className="border border-border rounded-lg p-3 bg-ink/30">
            <summary className="cursor-pointer text-sm text-foreground">{p.title ?? p.url}</summary>
            <pre className="mt-2 whitespace-pre-wrap text-[11px] font-mono text-muted-foreground max-h-[300px] overflow-auto">
              {p.markdown ?? ""}
            </pre>
          </details>
        ))}
      </div>
    ) : <RawJson data={data} />;
  }
  return <RawJson data={data} />;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RawJson({ data }: { data: any }) {
  return (
    <pre className="whitespace-pre-wrap text-xs font-mono text-muted-foreground max-h-[520px] overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}
