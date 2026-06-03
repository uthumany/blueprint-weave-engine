export type BuiltinTemplateId =
  | "vibecode"
  | "lovable"
  | "v0"
  | "cursor"
  | "explain"
  | "readme"
  | "refactor"
  | "custom";

// Templates are identified by string IDs. Built-ins use the names above;
// saved user variants use ids like "var_xxxx" (see customTemplates.ts).
export type TemplateId = BuiltinTemplateId | (string & {});

export const TEMPLATES: { id: BuiltinTemplateId; label: string; description: string; prompt: string }[] = [
  {
    id: "vibecode",
    label: "Vibecode rebuild (generic)",
    description: "Tool-agnostic build brief — works in Lovable, v0, Cursor, or Bolt.",
    prompt:
      "You are a senior product engineer briefing an AI coding tool (Lovable, v0, Cursor, Bolt) to REBUILD the project below from scratch as a modern web app. Using ONLY the repository contents provided, output a single, copy-paste-ready build prompt with these sections, in order:\n\n1. **One-liner** — what the product is, in one sentence.\n2. **Core user flows** — 3–7 bullets, each a concrete user journey (verbs first).\n3. **Feature list** — grouped by area (Auth, Data, UI, Integrations, etc.), each feature one line.\n4. **Tech stack & architecture** — frontend framework, styling, state, backend, database, auth, third-party APIs. Note which to keep vs. swap for the target stack (default target: React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase).\n5. **Data model** — every table/collection with fields, types, and relationships. Infer from code if no schema file exists.\n6. **API surface** — list each endpoint / server action with method, path, input, output.\n7. **Pages & routes** — every route with its purpose and key components.\n8. **Design direction** — colors, typography, spacing, component style, motion. Infer from CSS/Tailwind config and component code. Be specific (hex values, font names, radius scale).\n9. **Environment variables & secrets** — every key the app reads, with a one-line description.\n10. **Build order** — a numbered milestone plan (Milestone 1 → N) the AI tool should follow, each milestone shippable on its own.\n11. **Out of scope** — anything in the repo to deliberately skip in the rebuild.\n\nWrite in imperative voice (\"Build…\", \"Add…\", \"Wire…\"). No fluff, no apologies, no \"as an AI\". Cite file paths inline when a decision comes from a specific file. End with a single fenced code block titled `FINAL_PROMPT` that contains the assembled brief ready to paste into the target AI tool.",
  },
  {
    id: "lovable",
    label: "Lovable rebuild brief",
    description: "Tailored for Lovable: React + Vite + Tailwind + shadcn/ui + Lovable Cloud.",
    prompt:
      "You are briefing **Lovable** (lovable.dev) to rebuild the project below from scratch. Lovable's stack is fixed: React + Vite + TypeScript + Tailwind + shadcn/ui, with Lovable Cloud (managed Supabase) for auth, database, storage, and server functions. Using ONLY the repository contents provided, output a single copy-paste-ready prompt structured EXACTLY as Lovable expects:\n\n1. **Product one-liner** — one sentence.\n2. **Target users & primary jobs-to-be-done** — 2–4 bullets.\n3. **Pages & routes** — every route with purpose, key sections, and which components belong where. Use TanStack Router file-based routing (src/routes/*.tsx).\n4. **Design system** — concrete tokens for src/index.css (HSL color variables, font families, radius, spacing scale, shadows). Specify dark/light mode. Pull values from the source repo's CSS/Tailwind config; cite file paths.\n5. **Component inventory** — shadcn/ui components needed, plus custom components with prop signatures.\n6. **Data model** — every Supabase table with columns, types, RLS policy intent, and relationships. Note which tables need realtime.\n7. **Auth** — providers (email/password + Google by default), protected routes, and where to gate.\n8. **Server logic** — list each TanStack server function (createServerFn) with input/output. Flag anything needing secrets.\n9. **Integrations & secrets** — every external API key required.\n10. **Build order** — numbered milestones, each one a single Lovable turn that ships a working slice.\n11. **Explicit do-nots** — features in the source repo to skip.\n\nUse imperative voice. Reference shadcn components by name. Prefer Lovable Cloud over custom backends. End with a fenced code block titled `LOVABLE_PROMPT` containing the assembled brief ready to paste into a new Lovable project.",
  },
  {
    id: "v0",
    label: "v0 rebuild brief",
    description: "Tailored for Vercel v0: Next.js App Router + Tailwind + shadcn/ui + Server Actions.",
    prompt:
      "You are briefing **v0 by Vercel** (v0.dev) to rebuild the project below. v0's stack: Next.js 15 App Router + React Server Components + TypeScript + Tailwind + shadcn/ui, deployed on Vercel, with Server Actions and Neon/Vercel Postgres for data. Using ONLY the repository contents provided, produce a v0-shaped prompt:\n\n1. **What we're building** — 1–2 sentences.\n2. **Routes (App Router)** — every route as `app/<segment>/page.tsx` with a one-line description; mark Server vs Client Components and why.\n3. **Layouts & loading states** — list `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` per segment.\n4. **UI** — describe the visual style in v0's preferred terms (clean, modern, generous whitespace) and list shadcn/ui components needed. Specify colors as Tailwind classes or CSS variables in `app/globals.css`.\n5. **Data layer** — Postgres schema as `CREATE TABLE` statements; data access via Server Actions in `app/actions/*.ts` (list each action with input/output Zod schema).\n6. **Auth** — recommend Auth.js (NextAuth) with the providers used in the source repo.\n7. **Forms & mutations** — use `useFormState` / `useFormStatus` patterns; describe each form's action and validation.\n8. **Env vars** — every `process.env.*` the app reads.\n9. **Build order** — milestones small enough that each fits in one v0 generation (one route or one feature per step).\n10. **Out of scope**.\n\nWrite in imperative voice. Prefer Server Components by default; add `\"use client\"` only when needed. End with a fenced code block titled `V0_PROMPT` containing the assembled brief ready to paste into v0.",
  },
  {
    id: "cursor",
    label: "Cursor rebuild brief",
    description: "Tailored for Cursor: .cursorrules + ordered file-creation plan for the Agent.",
    prompt:
      "You are briefing **Cursor** (cursor.com) to rebuild the project below in an empty repo. Cursor works best with explicit rules + an ordered, file-by-file plan the Composer/Agent can execute deterministically. Using ONLY the repository contents provided, output a prompt with these sections:\n\n1. **Project summary** — 2–3 sentences.\n2. **`.cursorrules` file** — a complete fenced block containing project rules: language (TypeScript strict), framework, styling, lint/format, naming conventions, do/don't list, preferred libraries, testing approach. Infer from the source repo.\n3. **Tech stack decisions** — bullet list with rationale; keep close to the source unless there's a clear reason to swap.\n4. **Repository layout** — a tree (```text fenced block```) of the target folder structure.\n5. **Dependencies** — exact `pnpm add` / `pnpm add -D` commands grouped by purpose.\n6. **Data model & migrations** — SQL or ORM schema files to create, in order.\n7. **Implementation plan** — a numbered list of Composer prompts. Each step names the exact files to create/edit and what to put in them, sized so Cursor can apply it in one pass. Order: config → types/schema → data layer → server logic → UI primitives → pages → polish.\n8. **Verification per step** — the command to run after each step (`pnpm typecheck`, `pnpm test`, etc.) and what success looks like.\n9. **Env vars & secrets** — `.env.example` contents.\n10. **Out of scope**.\n\nWrite in imperative voice, addressed to the Cursor Agent. Be explicit about file paths. End with a fenced code block titled `CURSOR_PROMPT` containing the assembled brief plus the `.cursorrules` content, ready to paste into Cursor.",
  },
  {
    id: "explain",
    label: "Explain this codebase",
    description: "High-level architecture overview, key modules, and how data flows.",
    prompt:
      "You are a senior engineer onboarding a new teammate. Read the repository files below and produce: (1) a 1-paragraph summary of what this project does, (2) a bulleted architecture overview (entry points, key modules, data flow), (3) the dependency stack, (4) a glossary of any non-obvious domain terms, (5) suggested first files to read in order. Be specific and cite file paths.",
  },
  {
    id: "readme",
    label: "Generate a comprehensive README",
    description: "Markdown README with badges placeholders, install, usage, and contributing.",
    prompt:
      "You are a technical writer. Using ONLY the repository contents below, write a complete, polished README.md including: title + tagline, badges row (placeholders), Overview, Features, Tech Stack, Quick Start (install + run), Configuration / Environment, Project Structure, Scripts, Deployment, Contributing, License. Use accurate commands inferred from the files. Output valid Markdown only.",
  },
  {
    id: "refactor",
    label: "Suggest refactoring improvements",
    description: "Concrete refactors with file paths, rationale, and code sketches.",
    prompt:
      "You are a staff engineer performing a code review. Analyze the repository below and propose the top 10 highest-impact refactors. For each: (a) file path(s) involved, (b) the issue (1–2 sentences), (c) the proposed change with a short code sketch, (d) expected benefit, (e) risk level (low/med/high). Prioritize correctness, then maintainability, then performance. Be concrete — no generic advice.",
  },
];

export const SYSTEM_BLOCK = `You will be given the contents of a public GitHub repository, split into files. Each file is preceded by a Markdown header with its path and wrapped in a fenced code block. Use ONLY the provided content as ground truth — do not invent files, functions, or dependencies that are not shown. If important files appear missing or truncated, say so explicitly.`;

export function getTemplatePrompt(
  id: TemplateId,
  custom: string,
  variants?: { id: string; prompt: string }[],
): string {
  if (id === "custom") return custom.trim();
  const builtin = TEMPLATES.find((t) => t.id === id);
  if (builtin) return builtin.prompt;
  const variant = variants?.find((v) => v.id === id);
  return variant?.prompt ?? "";
}

