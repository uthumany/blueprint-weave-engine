// Server-only Context.dev REST wrapper. Base: https://api.context.dev/v1
// All calls fail soft — return { ok: false, error } instead of throwing.

const BASE = "https://api.context.dev/v1";

function key(): string | null {
  return process.env.CONTEXT_DEV_API_KEY ?? null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export type CtxResult =
  | { ok: true; data: any }
  | { ok: false; error: string; status?: number };

async function get(path: string, query: Record<string, any>): Promise<CtxResult> {
  const k = key();
  if (!k) return { ok: false, error: "CONTEXT_DEV_API_KEY missing" };
  const qs = new URLSearchParams();
  for (const [k2, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) v.forEach((item) => qs.append(k2, String(item)));
    else qs.set(k2, String(v));
  }
  try {
    const res = await fetch(`${BASE}${path}?${qs}`, {
      headers: { Authorization: `Bearer ${k}`, Accept: "application/json" },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: text.slice(0, 300) || res.statusText, status: res.status };
    }
    return { ok: true, data: await res.json() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function post(path: string, body: unknown): Promise<CtxResult> {
  const k = key();
  if (!k) return { ok: false, error: "CONTEXT_DEV_API_KEY missing" };
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${k}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: text.slice(0, 300) || res.statusText, status: res.status };
    }
    return { ok: true, data: await res.json() };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export const context = {
  scrapeMarkdown: (url: string, extra?: Record<string, any>): Promise<CtxResult> =>
    get("/web/scrape/markdown", { url, ...extra }),
  scrapeHtml: (url: string, extra?: Record<string, any>): Promise<CtxResult> =>
    get("/web/scrape/html", { url, ...extra }),
  scrapeImages: (url: string, extra?: Record<string, any>): Promise<CtxResult> =>
    get("/web/scrape/images", { url, ...extra }),
  crawlSitemap: (domain: string, extra?: Record<string, any>): Promise<CtxResult> =>
    get("/web/scrape/sitemap", { domain, ...extra }),
  screenshot: (domainOrUrl: string, extra?: Record<string, any>): Promise<CtxResult> => {
    const isUrl = /^https?:\/\//i.test(domainOrUrl);
    return get(
      "/web/screenshot",
      isUrl ? { directUrl: domainOrUrl, ...extra } : { domain: domainOrUrl, ...extra },
    );
  },
  webSearch: (query: string, extra?: Record<string, any>): Promise<CtxResult> =>
    post("/web/search", { query, numResults: 10, ...extra }),
  crawlSite: (url: string, extra?: Record<string, any>): Promise<CtxResult> =>
    post("/web/crawl", { url, maxPages: 20, maxDepth: 2, ...extra }),
};
