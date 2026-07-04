# Plan: Honcho memory + Context.dev tools

## Goals
- Persistent, self-improving memory via **Honcho** (`HONCHO_API_KEY` already in secrets), scoped per browser anonymously and merged into the Supabase user peer on sign-in.
- Expose all **7 Context.dev tools** (`CONTEXT_DEV_API_KEY` already in secrets): crawl site, web search, scrape markdown, scrape HTML, scrape images, crawl sitemap, screenshot.
- Plug both into the existing Analyze (URL / screenshot / image-URL) flow.

## Architecture

### Server layer (TanStack `createServerFn`, no edge functions)
New file `src/lib/honcho/honcho.server.ts`:
- Thin REST wrapper around Honcho (`https://api.honcho.dev`) using `HONCHO_API_KEY`.
- Helpers: `getOrCreateWorkspace`, `upsertPeer(peerId)`, `createSession`, `addMessages`, `queryDialectic(peerId, question)`, `getWorkingRepresentation(peerId)`, `mergePeers(anonId, userId)`.

New file `src/lib/context/context.server.ts`:
- Wrapper around Context.dev REST endpoints for the 7 tools.

New file `src/lib/memory/memory.functions.ts` (`createServerFn`):
- `resolvePeer({ anonId })` → returns effective peerId (uses `requireSupabaseAuth` optionally; if signed-in, returns `user:<uid>`, merges anon on first call).
- `recordAnalysis({ peerId, source, profile })` → writes structured message to Honcho session.
- `getPreferences({ peerId })` → dialectic query: "What visual moods, palettes, typography, and source domains does this user prefer? Return JSON."
- `listRecentSources({ peerId, limit })` → recent sources from working representation.
- `recordFeedback({ peerId, profileId, kept, edits })` → captures deltas for learning.

New file `src/lib/context/context.functions.ts` (`createServerFn`):
- `ctxWebSearch`, `ctxScrapeMarkdown`, `ctxScrapeHtml`, `ctxScrapeImages`, `ctxScreenshot`, `ctxCrawlSite`, `ctxCrawlSitemap`. All Zod-validated, return DTOs.

### Analyze flow changes (`src/routes/api/analyze.ts` + `src/lib/useAnalyze.ts`)
- Before analysis: fetch `getPreferences(peerId)` and inject as a **bias prompt** into the LLM system message ("User historically prefers X moods, Y palettes; weight accordingly, but don't fabricate").
- Add optional Context.dev enrichment path: for `kind: "url"`, in parallel fetch `ctxScrapeMarkdown(url)` and `ctxScreenshot(url)` and feed both into the model alongside the existing pipeline — improves fidelity vs. current fetch.
- After analysis: `recordAnalysis` + emit new SSE event `type: "memory"` with `{ appliedPreferences, sessionId }` so UI can show a subtle "learning from your past picks" badge.

### Client memory glue
New file `src/lib/memory/peer.ts`:
- `getAnonPeerId()` — localStorage `honcho.anonId`, mint uuid on first call.
- `onSignIn(userId)` — calls `resolvePeer` server fn to merge.
- Wire into `src/routes/__root.tsx` inside the existing `onAuthStateChange` filter.

### UI additions in `IngestionPanel.tsx`
- Under the existing "try" chips row, add a **Recent** row populated from `listRecentSources` (uses `FancyChipButton`).
- Small "Learned preferences" tooltip (Icon3D `Star`) that opens a popover showing top mood/palette/typography preferences.
- Feedback: on the Profile preview, add 👍 / ✎ buttons calling `recordFeedback` to close the learning loop.

### New route: `/research` (Context.dev workbench)
`src/routes/research.tsx` — tabbed UI (7 tabs, one per tool) using existing glass/surface tokens. Each tab: input(s) → server fn call → result panel (markdown render, image grid, screenshot preview, sitemap list). All calls go through `context.functions.ts`. History of runs stored in Honcho session `research` so returning users see prior queries.
- Add nav link in `SiteHeader.tsx`.
- Head metadata: title "Research · Notepadify", meta description, og:type website.

## Security & runtime
- Both API keys read via `process.env.*` **inside handlers only** (Cloudflare Worker constraint).
- Input Zod-validated; URLs restricted to `http(s)`; response sizes capped (markdown 500KB, image list 200).
- No admin Supabase usage; anon peer id lives in localStorage (non-sensitive).
- No new DB tables required (Honcho is the store). If sign-in merge is requested repeatedly, cache `merged:<uid>` flag in localStorage to avoid re-calling.

## Files to add
- `src/lib/honcho/honcho.server.ts`
- `src/lib/context/context.server.ts`
- `src/lib/context/context.functions.ts`
- `src/lib/memory/memory.functions.ts`
- `src/lib/memory/peer.ts`
- `src/routes/research.tsx`
- `src/components/PreferencesPopover.tsx`
- `src/components/RecentSources.tsx`

## Files to edit
- `src/routes/api/analyze.ts` — inject preferences, optional Context.dev enrichment, emit `memory` SSE event, record analysis.
- `src/lib/useAnalyze.ts` — handle `memory` SSE event; pass `peerId`.
- `src/components/IngestionPanel.tsx` — recent chips + preferences popover.
- `src/components/ProfilePreview.tsx` — feedback buttons.
- `src/components/SiteHeader.tsx` — `/research` link.
- `src/routes/__root.tsx` — anon peer bootstrap + merge on sign-in.

## Verification
1. `bun run build` (typecheck + Vite build).
2. Playwright: submit `linear.app` URL twice with distinct feedback; second run's SSE `memory` event should include non-empty `appliedPreferences`.
3. Visit `/research`, run web search + screenshot; screenshot file downloadable, markdown renders.
4. Sign in mid-session; verify anon session merged (subsequent `getPreferences` returns pre-signin data).
