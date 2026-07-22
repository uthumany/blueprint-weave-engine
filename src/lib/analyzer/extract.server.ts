// Server-only CSS/HTML extractor. Regex-based — no CSSOM available in Workers.
// Given raw HTML (with inline <style> + optional fetched external CSS text),
// returns the deterministic slice of a DnaProfile.

import type {
  PaletteEntry,
  SpacingEntry,
  RadiusEntry,
  ShadowEntry,
  FontFace,
  CssCustomProperty,
  ButtonSpec,
  TypeDetail,
  FontInfo,
} from "./schema";

// ---------- utilities ----------

function normHex(raw: string): string | null {
  const m = raw.trim().toLowerCase().match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length === 8) h = h.slice(0, 6);
  return "#" + h;
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return "#" + c(r) + c(g) + c(b);
}

function extractHexFromColorValue(v: string): string[] {
  const out: string[] = [];
  const hexes = v.match(/#([0-9a-f]{3,8})\b/gi) ?? [];
  for (const h of hexes) {
    const n = normHex(h);
    if (n) out.push(n);
  }
  const rgbs =
    v.match(/rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/gi) ?? [];
  for (const r of rgbs) {
    const m = r.match(/rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/i);
    if (m) out.push(rgbToHex(+m[1], +m[2], +m[3]));
  }
  return out;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastLabel(hex: string): "light" | "dark" {
  return luminance(hex) > 0.5 ? "dark" : "light";
}

function cleanFontFamily(v: string): { primary: string; fallback: string } {
  const parts = v.split(",").map((p) => p.trim().replace(/^["']|["']$/g, ""));
  const primary = parts[0] || "sans-serif";
  const fallback = parts.slice(1).join(", ") || "sans-serif";
  return { primary, fallback };
}

function toPx(v: string): number | null {
  const m = v.trim().match(/^(-?[\d.]+)(px|rem|em)?$/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!isFinite(n)) return null;
  const unit = (m[2] ?? "px").toLowerCase();
  if (unit === "rem" || unit === "em") return n * 16;
  return n;
}

// ---------- HTML fetch + CSS gather ----------

export type RawSource = {
  html: string;
  css: string;
  title: string;
  description: string;
  heroHeadline?: string;
  heroSubtitle?: string;
  finalUrl: string;
};

async function safeFetchText(url: string, ms = 8000): Promise<string> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; NotepadifyBot/1.0; +https://notepadifly.lovable.app)",
        accept: "text/html,text/css,*/*;q=0.8",
      },
    });
    clearTimeout(t);
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

export async function fetchSite(url: string): Promise<RawSource> {
  const html = await safeFetchText(url);
  const base = new URL(url);

  // Inline <style>
  const inlineCss: string[] = [];
  for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) inlineCss.push(m[1]);

  // Linked stylesheets — best-effort, cap to 6
  const linkRe =
    /<link[^>]+rel=["']?stylesheet["']?[^>]*href=["']([^"']+)["'][^>]*>/gi;
  const linkedHrefs: string[] = [];
  for (const m of html.matchAll(linkRe)) linkedHrefs.push(m[1]);
  const linkedCss = await Promise.all(
    linkedHrefs.slice(0, 6).map(async (href) => {
      try {
        return await safeFetchText(new URL(href, base).toString());
      } catch {
        return "";
      }
    }),
  );

  const css = [inlineCss.join("\n"), linkedCss.join("\n")].join("\n");

  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "")
    .replace(/\s+/g, " ")
    .trim();
  const description =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    )?.[1] ??
    html.match(
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
    )?.[1] ??
    "";

  const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const h2 = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)?.[1];
  const heroHeadline = h1 ? stripTags(h1).slice(0, 120) : undefined;
  const heroSubtitle = h2 ? stripTags(h2).slice(0, 200) : undefined;

  return { html, css, title, description, heroHeadline, heroSubtitle, finalUrl: url };
}

// ---------- extractors ----------

export function extractPalette(css: string): PaletteEntry[] {
  const bg = new Map<string, number>();
  const text = new Map<string, number>();
  const border = new Map<string, number>();

  const bump = (m: Map<string, number>, hex: string) =>
    m.set(hex, (m.get(hex) ?? 0) + 1);

  // Property-scoped tallies
  for (const m of css.matchAll(
    /background(?:-color)?\s*:\s*([^;{}]+?)(?:;|\})/gi,
  )) {
    for (const h of extractHexFromColorValue(m[1])) bump(bg, h);
  }
  for (const m of css.matchAll(/(?<![-\w])color\s*:\s*([^;{}]+?)(?:;|\})/gi)) {
    for (const h of extractHexFromColorValue(m[1])) bump(text, h);
  }
  for (const m of css.matchAll(/border(?:-[\w-]+)?\s*:\s*([^;{}]+?)(?:;|\})/gi)) {
    for (const h of extractHexFromColorValue(m[1])) bump(border, h);
  }

  const roleOf = (h: string): PaletteEntry["role"] => {
    const b = bg.get(h) ?? 0;
    const t = text.get(h) ?? 0;
    const br = border.get(h) ?? 0;
    if (b >= t && b >= br) return "block";
    if (t >= br) return "text-accent";
    return "border";
  };

  const all = new Map<string, number>();
  for (const [h, n] of bg) all.set(h, (all.get(h) ?? 0) + n);
  for (const [h, n] of text) all.set(h, (all.get(h) ?? 0) + n);
  for (const [h, n] of border) all.set(h, (all.get(h) ?? 0) + n);

  return Array.from(all.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 24)
    .map(([hex, count]) => ({
      hex,
      role: roleOf(hex),
      count,
      area: count * 100,
      contrast: contrastLabel(hex),
    }));
}

export function extractFontFaces(css: string): FontFace[] {
  const out: FontFace[] = [];
  for (const m of css.matchAll(/@font-face\s*\{([^}]+)\}/gi)) {
    const block = m[1];
    const family = block
      .match(/font-family\s*:\s*([^;]+);?/i)?.[1]
      ?.trim()
      .replace(/^["']|["']$/g, "");
    if (!family) continue;
    const src = block.match(/src\s*:\s*[^;]*url\(\s*["']?([^"')]+)["']?\s*\)/i)?.[1] ?? "";
    const style = block.match(/font-style\s*:\s*([^;]+);?/i)?.[1]?.trim() ?? "normal";
    const weight = block.match(/font-weight\s*:\s*([^;]+);?/i)?.[1]?.trim() ?? "400";
    out.push({ family, src, style, weight });
  }
  // dedupe
  const seen = new Set<string>();
  return out.filter((f) => {
    const k = `${f.family}|${f.style}|${f.weight}|${f.src}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export function extractCssCustomProperties(
  css: string,
): CssCustomProperty[] {
  const out: CssCustomProperty[] = [];
  const rootBlocks = css.matchAll(/(:root|html)\s*\{([^}]+)\}/gi);
  const seen = new Set<string>();
  for (const rb of rootBlocks) {
    const body = rb[2];
    for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      const name = m[1];
      const value = m[2].trim();
      if (seen.has(name)) continue;
      seen.add(name);
      let category: CssCustomProperty["category"] = "other";
      if (/color|bg|fill|stroke|shadow|palette/i.test(name)) category = "color";
      else if (/font|text|leading|tracking|type/i.test(name)) category = "typography";
      else if (/space|spacing|gap|pad|margin|size|radius/i.test(name))
        category = "spacing";
      out.push({ name, value, category });
    }
  }
  return out;
}

export function extractTypography(css: string): {
  fontSizes: number[];
  lineHeights: number[];
  details: TypeDetail[];
  headingFont?: FontInfo;
  bodyFont?: FontInfo;
} {
  const sizes = new Map<number, number>();
  const lhs = new Map<number, number>();

  for (const m of css.matchAll(/font-size\s*:\s*([^;{}]+?)(?:;|\})/gi)) {
    const px = toPx(m[1]);
    if (px && px > 6 && px < 400) sizes.set(px, (sizes.get(px) ?? 0) + 1);
  }
  for (const m of css.matchAll(/line-height\s*:\s*([^;{}]+?)(?:;|\})/gi)) {
    const px = toPx(m[1]);
    if (px && px > 6 && px < 400) lhs.set(px, (lhs.get(px) ?? 0) + 1);
  }

  const fontSizes = Array.from(sizes.entries())
    .sort((a, b) => b[0] - a[0])
    .slice(0, 12)
    .map(([v]) => v);
  const lineHeights = Array.from(lhs.entries())
    .sort((a, b) => b[0] - a[0])
    .slice(0, 8)
    .map(([v]) => v);

  // Find heading + body font families by selector heuristics
  const familyTally = new Map<string, { count: number; hasHeading: boolean; hasBody: boolean }>();
  const bump = (fam: string, hasHeading: boolean, hasBody: boolean) => {
    const cur = familyTally.get(fam) ?? { count: 0, hasHeading: false, hasBody: false };
    cur.count += 1;
    cur.hasHeading ||= hasHeading;
    cur.hasBody ||= hasBody;
    familyTally.set(fam, cur);
  };

  const ruleRe = /([^{}]+)\{([^}]+)\}/g;
  for (const r of css.matchAll(ruleRe)) {
    const selector = r[1].toLowerCase();
    const body = r[2];
    const famMatch = body.match(/font-family\s*:\s*([^;{}]+?)(?:;|\})/i);
    if (!famMatch) continue;
    const { primary } = cleanFontFamily(famMatch[1]);
    if (!primary) continue;
    const hasHeading = /\bh[1-6]\b|heading|display|title/.test(selector);
    const hasBody = /\bbody\b|:root|html|\bp\b|\bmain\b|article|paragraph/.test(selector);
    bump(primary, hasHeading, hasBody);
  }

  const ranked = Array.from(familyTally.entries()).sort((a, b) => b[1].count - a[1].count);
  const headingCandidate = ranked.find((r) => r[1].hasHeading) ?? ranked[0];
  const bodyCandidate = ranked.find((r) => r[1].hasBody && r[0] !== headingCandidate?.[0]) ?? ranked[0];

  const makeFontInfo = (
    fam: string | undefined,
    usedFor: FontInfo["usedFor"],
  ): FontInfo | undefined => {
    if (!fam) return undefined;
    return {
      family: fam,
      cleanFamily: fam,
      weights: [],
      usedFor,
      fallback: "sans-serif",
    };
  };

  // Build TypeDetail rows from most-common heading-ish sizes
  const scale = fontSizes.slice(0, 10).sort((a, b) => b - a);
  const roles = ["Display", "H1", "H2", "H3", "H4", "Body L", "Body", "Small", "XS", "Caption"];
  const details: TypeDetail[] = scale.map((size, i) => ({
    role: roles[i] ?? `Size ${i + 1}`,
    size,
    weight: i < 5 ? "700" : "400",
    lineHeight: `${size}px`,
    letterSpacing: "normal",
    font: (i < 5 ? headingCandidate?.[0] : bodyCandidate?.[0]) ?? "sans-serif",
  }));

  return {
    fontSizes: scale,
    lineHeights,
    details,
    headingFont: makeFontInfo(headingCandidate?.[0], "heading"),
    bodyFont: makeFontInfo(bodyCandidate?.[0], "body"),
  };
}

function tallyLengthProperty(
  css: string,
  propRe: RegExp,
): Map<number, number> {
  const m = new Map<number, number>();
  for (const match of css.matchAll(propRe)) {
    // A single declaration may hold multiple lengths (padding: 8px 16px)
    for (const raw of match[1].split(/\s+/)) {
      const px = toPx(raw);
      if (px !== null && px > 0 && px < 500) m.set(px, (m.get(px) ?? 0) + 1);
    }
  }
  return m;
}

export function extractSpacing(css: string): { base: number; common: SpacingEntry[] } {
  const tallies = tallyLengthProperty(
    css,
    /(?:padding|margin|gap)(?:-[a-z]+)?\s*:\s*([^;{}]+?)(?:;|\})/gi,
  );
  const sorted = Array.from(tallies.entries()).sort((a, b) => b[1] - a[1]);
  const common: SpacingEntry[] = sorted.slice(0, 10).map(([value, count]) => ({
    value,
    count,
    role: value >= 32 ? "card" : "element",
  }));
  const base = common[0]?.value ?? 8;
  return { base, common };
}

export function extractRadius(css: string): RadiusEntry[] {
  const tallies = tallyLengthProperty(
    css,
    /border-radius\s*:\s*([^;{}]+?)(?:;|\})/gi,
  );
  return Array.from(tallies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([value, count]) => ({
      value,
      count,
      role: value >= 60 ? "pill" : value >= 24 ? "card" : "button",
    }));
}

export function extractShadows(css: string): ShadowEntry[] {
  const tallies = new Map<string, number>();
  for (const m of css.matchAll(/box-shadow\s*:\s*([^;{}]+?)(?:;|\})/gi)) {
    const v = m[1].trim();
    if (v === "none" || !v) continue;
    tallies.set(v, (tallies.get(v) ?? 0) + 1);
  }
  const level = (v: string): ShadowEntry["level"] => {
    const px = (v.match(/(-?\d+)px/g) ?? []).map((s) => parseInt(s));
    const max = Math.max(0, ...px.map((n) => Math.abs(n)));
    if (max >= 60) return "deep";
    if (max >= 12) return "medium";
    return "soft";
  };
  return Array.from(tallies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([value, count]) => ({ value, count, level: level(value) }));
}

export function extractButtons(css: string): ButtonSpec[] {
  const specs: ButtonSpec[] = [];
  const ruleRe = /([^{}]+)\{([^}]+)\}/g;
  for (const m of css.matchAll(ruleRe)) {
    const selector = m[1].toLowerCase();
    if (!/(^|[\s,.:#\[>])(btn|button|cta)\b/.test(selector)) continue;
    const body = m[2];
    const get = (re: RegExp) => body.match(re)?.[1]?.trim() ?? "";
    const bg = get(/background(?:-color)?\s*:\s*([^;{}]+)/i) || "transparent";
    const color = get(/(?<![-\w])color\s*:\s*([^;{}]+)/i) || "";
    const border = get(/border\s*:\s*([^;{}]+)/i);
    const rad = toPx(get(/border-radius\s*:\s*([^;{}]+)/i)) ?? 0;
    const size = toPx(get(/font-size\s*:\s*([^;{}]+)/i)) ?? 14;
    const weight = get(/font-weight\s*:\s*([^;{}]+)/i) || "400";
    const padDecl = get(/padding\s*:\s*([^;{}]+)/i);
    const padTokens = padDecl.split(/\s+/).map((s) => toPx(s) ?? 0);
    const paddingV = padTokens[0] ?? 0;
    const paddingH = padTokens[1] ?? padTokens[0] ?? 0;
    const isGhost = /transparent|none/i.test(bg);
    const isOutline = !!border && !isGhost;
    specs.push({
      bg: isGhost ? "transparent" : normalizeColor(bg),
      border: border ?? "",
      borderRadius: rad,
      color: normalizeColor(color) || "#000000",
      fontSize: size,
      fontWeight: weight,
      paddingH,
      paddingV,
      variant: isGhost ? "ghost" : isOutline ? "outline" : "filled",
    });
    if (specs.length >= 10) break;
  }
  return specs;
}

function normalizeColor(v: string): string {
  const hex = extractHexFromColorValue(v)[0];
  return hex ?? v.trim();
}

// ---------- top-level ----------

export type DeterministicExtract = {
  url: string;
  title: string;
  description: string;
  heroHeadline?: string;
  heroSubtitle?: string;
  palette: PaletteEntry[];
  fontFaces: FontFace[];
  cssCustomProperties: CssCustomProperty[];
  typography: ReturnType<typeof extractTypography>;
  spacing: { base: number; common: SpacingEntry[] };
  borderRadius: RadiusEntry[];
  shadows: ShadowEntry[];
  buttons: ButtonSpec[];
};

export async function extractFromUrl(url: string): Promise<DeterministicExtract> {
  const src = await fetchSite(url);
  return {
    url: src.finalUrl,
    title: src.title,
    description: src.description,
    heroHeadline: src.heroHeadline,
    heroSubtitle: src.heroSubtitle,
    palette: extractPalette(src.css),
    fontFaces: extractFontFaces(src.css),
    cssCustomProperties: extractCssCustomProperties(src.css),
    typography: extractTypography(src.css),
    spacing: extractSpacing(src.css),
    borderRadius: extractRadius(src.css),
    shadows: extractShadows(src.css),
    buttons: extractButtons(src.css),
  };
}
