# GitHub Repo URL → Prompt Tool

A new full-screen route at `/repo-to-prompt` that turns any public GitHub repo into a copy-ready AI prompt. Fully client-side — no backend, no API keys, no login.

## New files

- `src/routes/repo-to-prompt.tsx` — route + page shell, head() metadata
- `src/components/repo-prompt/RepoUrlInput.tsx` — URL field, validate button, inline errors
- `src/components/repo-prompt/FileTree.tsx` — collapsible checkbox tree with size badges
- `src/components/repo-prompt/TemplatePicker.tsx` — 3 preset templates + custom textarea
- `src/components/repo-prompt/PromptPreview.tsx` — read-only output, char/token count, Copy + Download .md
- `src/lib/repo-prompt/github.ts` — pure fetch helpers (validate, tree, raw content)
- `src/lib/repo-prompt/aggregate.ts` — filtering, signal-file detection, prompt assembly, truncation
- `src/lib/repo-prompt/templates.ts` — the 3 fixed templates + system instruction block

Add nav link to `/repo-to-prompt` in `SiteHeader.tsx`.

## Pipeline (all in-browser)

1. **Validate** — regex parse `https://github.com/{owner}/{repo}` (strip `.git`, `/tree/branch/...`). Call `GET https://api.github.com/repos/{owner}/{repo}` → confirm exists, public, capture `default_branch`. On 403 show rate-limit hint (60/hr/IP); on 404 show "not found or private".
2. **Tree** — `GET /repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1`. Filter `type==='blob'`, drop binary extensions (png/jpg/gif/webp/ico/pdf/zip/tar/gz/woff/ttf/mp4/exe/so/dll/wasm/lock-files-optional), drop `node_modules`, `dist`, `build`, `.next`, `vendor`, `.git`. Sort folder-first.
3. **Auto-select signal files** — `README*`, `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Makefile`, `Dockerfile`, `tsconfig.json`, `src/index.*`, `src/main.*`, `src/app.*`, root config files.
4. **Aggregate** — for each checked file, `GET https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}` in parallel (batched, ~8 concurrent). Wrap as:
   ```
   ### path/to/file.ts
   ```ts
   <content>
   ```
   ```
   Track running char total; once > 40,000 (user-adjustable slider 10k–200k) append `[TRUNCATED]` and stop. Language tag inferred from extension.
5. **Compose** — `<template prefix> + <system block> + <aggregated files>`. Custom prompt replaces the template prefix but keeps the file dump.
6. **Output** — render in mono textarea. Buttons: Copy (Clipboard API + toast), Download .md (Blob + anchor). Live char count + token estimate (chars/4).

## UI / UX

- Full-screen page consistent with existing `/profiles`, `/generate` routes (same `SiteHeader`, dark theme, semantic tokens from `src/styles.css`).
- Three-step layout: **Input** → **Select files** (appears after validation) → **Preview** (appears after Build). Framer-motion fade/slide between steps.
- File tree: collapsible folders, per-file size in bytes, "Select signals" / "Clear all" buttons, running total chars + token estimate at top.
- Template picker: 3 cards ("Explain codebase", "Generate README", "Suggest refactors") + "Custom" toggle revealing textarea.
- Loading states: spinner during validate, progress bar (n/total fetched) during aggregation, cancel button.
- Errors inline near the source (invalid URL, rate limit, fetch failure per file → marked as skipped in output).
- Responsive: stacks single-column < 768px; file tree becomes a `<details>` accordion on mobile.

## Technical notes

- Zod schema for URL parsing.
- All fetches use plain `fetch` (no auth header → 60/hr unauthenticated limit). Catch 403 with `X-RateLimit-Remaining: 0` and surface remaining time from `X-RateLimit-Reset`.
- Concurrency via simple `Promise.all` over chunks of 8.
- Token estimate: `Math.ceil(chars / 4)`.
- No new dependencies needed (use existing `lucide-react`, `framer-motion`, shadcn `Button`, `Input`, `Textarea`, `Card`, `Checkbox`, `Slider`, `Tabs`, `sonner` toast).
- No backend, no server functions, no Supabase use.