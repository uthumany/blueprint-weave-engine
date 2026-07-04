import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const urlSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine((s) => /^https?:\/\//i.test(s), "must be http(s)");

async function call<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  ...args: A
): Promise<R> {
  const mod = await import("./context.server");
  void mod;
  return fn(...args);
}

// Load server module inside handlers (kept out of client bundle).
async function ctx() {
  const { context } = await import("./context.server");
  return context;
}

export const ctxScrapeMarkdown = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => z.object({ url: urlSchema }).parse(d))
  .handler(async ({ data }) => (await ctx()).scrapeMarkdown(data.url, { useMainContentOnly: true }));

export const ctxScrapeHtml = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => z.object({ url: urlSchema }).parse(d))
  .handler(async ({ data }) => (await ctx()).scrapeHtml(data.url));

export const ctxScrapeImages = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) => z.object({ url: urlSchema }).parse(d))
  .handler(async ({ data }) => (await ctx()).scrapeImages(data.url));

export const ctxScreenshot = createServerFn({ method: "POST" })
  .inputValidator((d: { target: string; fullPage?: boolean }) =>
    z
      .object({
        target: z.string().min(1).max(2048),
        fullPage: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) =>
    (await ctx()).screenshot(data.target, { fullScreenshot: data.fullPage ?? false }),
  );

export const ctxCrawlSite = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string; maxPages?: number }) =>
    z
      .object({ url: urlSchema, maxPages: z.number().int().min(1).max(50).optional() })
      .parse(d),
  )
  .handler(async ({ data }) =>
    (await ctx()).crawlSite(data.url, { maxPages: data.maxPages ?? 15, useMainContentOnly: true }),
  );

export const ctxCrawlSitemap = createServerFn({ method: "POST" })
  .inputValidator((d: { domain: string; maxLinks?: number }) =>
    z
      .object({
        domain: z.string().min(1).max(255),
        maxLinks: z.number().int().min(1).max(5000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) =>
    (await ctx()).crawlSitemap(data.domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, ""), {
      maxLinks: data.maxLinks ?? 500,
    }),
  );

export const ctxWebSearch = createServerFn({ method: "POST" })
  .inputValidator((d: { query: string; numResults?: number }) =>
    z
      .object({
        query: z.string().min(1).max(500),
        numResults: z.number().int().min(1).max(20).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => (await ctx()).webSearch(data.query, { numResults: data.numResults ?? 10 }));
