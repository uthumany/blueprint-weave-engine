
## Goal

Match the reference output (`design.json` + `DESIGN.md` you attached) — a forensic, HTML/CSS-grounded profile with palette roles, full type scale, spacing scale, radius scale, shadows, component specs, @font-face URLs, and CSS custom properties — instead of the current thin 6-color/one-shadow JSON from the vision model.

## What changes

### 1. Rich schema (`src/lib/useAnalyze.ts`)
Extend `DnaProfile` to mirror the reference:

```ts
type DnaProfile = {
  url?: string; title?: string; description?: string; scrapedAt: string;
  colors: {
    bg, bgSecondary, text, textSecondary, primary, secondary, border: string;
    palette: { hex, role, count, area, contrast }[];
  };
  typography: {
    headingFont: { family, cleanFamily, weights[], usedFor, fallback, realUrl? };
    bodyFont: { ... };
    fontSizes: number[]; lineHeights: number[];
    details: { role, size, weight, lineHeight, letterSpacing, font }[];
  };
  spacing: { base: number; common: { value, count, role }[] };
  borderRadius: { value, count, role }[];
  shadows: { value, count, level }[];
  components: { primaryButton, buttons[], card };
  fontFaces: { family, src, style, weight }[];
  cssCustomProperties: { name, value, category }[];
  tags: string[]; mood: string; heroHeadline?: string; heroSubtitle?: string;
  confidence: number;
};
```
Keep the old flat fields as a computed view for the existing `ProfilePreview` so nothing breaks.

### 2. HTML-grounded extraction (`src/routes/api/analyze.ts`)
Vision alone can't produce hex-accurate palettes, font URLs, or CSS variables. New pipeline for `kind === "url"`:

1. **Scrape** — call Context.dev `scrapeHtml` to get raw HTML + inline/linked CSS (already wired in `context.server.ts`).
2. **Parse locally** (new `src/lib/analyzer/extract.ts`, server-only):
   - Regex/CSSOM-lite extraction of `@font-face` blocks → `fontFaces[]`
   - `:root`/`html` custom properties → `cssCustomProperties[]` (categorize by name: color/typography/spacing/other)
   - Tally `color`, `background-color`, `border-color` hex values → ranked palette with counts
   - Tally `font-size`, `line-height`, `letter-spacing`, `border-radius`, `padding`, `margin`, `gap` values → scales
   - Tally `box-shadow` values → deep/medium/soft levels
   - Extract `<title>`, meta description, first H1/H2 → hero headline/subtitle
3. **Screenshot** (existing microlink/thum.io fallback) — still used for the vision pass and preview image.
4. **Vision pass** — send Gemini the screenshot **plus the extracted raw tokens** and ask it to (a) assign semantic roles (primary/secondary/bg/text/border), (b) infer mood tags, (c) classify buttons detected from CSS, (d) rate confidence. Model output is merged with the deterministic extracted data — deterministic wins on hex/size/URL fields.
5. For `image-url` / `screenshot` uploads: skip step 1–2, run vision-only, populate only fields the model can infer (same as today but reshaped into the new schema).

Stream new phase: `extracting` between `capture` and `handoff` with real per-token log lines (`palette · 24 unique hex`, `fontFaces · 4 @font-face`, `custom properties · 33 tokens`).

### 3. Markdown export (`src/lib/analyzer/markdown.ts`)
Pure function `profileToMarkdown(profile)` producing the 10-section `DESIGN.md` layout from your reference: Visual Theme, Color Palette & Roles, Typography Rules, Component Stylings (CSS blocks), Layout Principles, Depth & Elevation, Do's/Don'ts, Responsive Behavior, Agent Prompt Guide, CSS Custom Properties tables.

### 4. Export UI (`src/routes/index.tsx`)
Replace the single "Download .dna.json" button with three:
- **Download `design.json`** — full new schema
- **Download `DESIGN.md`** — rendered markdown
- **Copy JSON** (existing)

### 5. Profile preview (`src/components/ProfilePreview.tsx`)
Show the extra info when present: role-labeled swatch grid (bg/text/primary/secondary/accents), font-family strings with `@font-face` badge, full type-scale row, radius scale row, shadow preview swatch. Falls back cleanly on image-only analyses.

## Non-goals

- No changes to Repo→Prompt, Research page, Honcho memory shape, or router/auth.
- No new dependencies — regex-based CSS parsing is enough for this schema (mirrors what the reference clearly did).
- Image-URL/screenshot uploads keep vision-only output (the source doesn't have HTML). We just reshape into the new schema with empty `fontFaces` / `cssCustomProperties`.

## Files touched

- new `src/lib/analyzer/extract.ts` (server-only CSS/HTML extractor)
- new `src/lib/analyzer/markdown.ts` (profile → DESIGN.md)
- edit `src/lib/useAnalyze.ts` (new `DnaProfile` type)
- edit `src/routes/api/analyze.ts` (extract → vision → merge pipeline, new phase)
- edit `src/components/ProfilePreview.tsx` (richer render, backward-compatible)
- edit `src/routes/index.tsx` (three export buttons)
