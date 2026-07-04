// Server-only Context.dev REST wrapper. Base: https://api.context.dev/v1
// All calls fail soft — return { ok: false, error } instead of throwing.

const BASE = "https://api.context.dev/v1";

function key(): string | null {
  return process.env.CONTEXT_DEV_API_KEY ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CtxResult<T = any> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

async function get<T>(path: string, query: Record<string, unknown>): Promise<CtxResult<T>> {
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
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

async function post<T>(path: string, body: unknown): Promise<CtxResult<T>> {
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
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// Public wrappers — each returns CtxResult<T> so callers show errors instead of blowing up.
export const context = {
  scrapeMarkdown: (url: string, extra?: Record<string, unknown>) =>
    get<{ markdown?: string; url?: string; metadata?: Record<string, unknown> }>(
      "/web/scrape/markdown",
      { url, ...extra },
    ),
  scrapeHtml: (url: string, extra?: Record<string, unknown>) =>
    get<{ html?: string; url?: string; metadata?: Record<string, unknown> }>(
      "/web/scrape/html",
      { url, ...extra },
    ),
  scrapeImages: (url: string, extra?: Record<string, unknown>) =>
    get<{ images?: Array<Record<string, unknown>>; url?: string }>(
      "/web/scrape/images",
      { url, ...extra },
    ),
  crawlSitemap: (domain: string, extra?: Record<string, unknown>) =>
    get<{ urls?: string[]; sitemap?: string[] }>("/web/scrape/sitemap", {
      domain,
      ...extra,
    }),
  screenshot: (domainOrUrl: string, extra?: Record<string, unknown>) => {
    const isUrl = /^https?:\/\//i.test(domainOrUrl);
    return get<{ screenshot?: string; url?: string; image?: string }>(
      "/web/screenshot",
      isUrl ? { directUrl: domainOrUrl, ...extra } : { domain: domainOrUrl, ...extra },
    );
  },
  webSearch: (query: string, extra?: Record<string, unknown>) =>
    post<{ results?: Array<Record<string, unknown>> }>("/web/search", {
      query,
      numResults: 10,
      ...extra,
    }),
  crawlSite: (url: string, extra?: Record<string, unknown>) =>
    post<{ pages?: Array<Record<string, unknown>> }>("/web/crawl", {
      url,
      maxPages: 20,
      maxDepth: 2,
      ...extra,
    }),
};
