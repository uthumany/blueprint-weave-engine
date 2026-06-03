export type TemplateId = "vibecode" | "explain" | "readme" | "refactor" | "custom";

export const TEMPLATES: { id: TemplateId; label: string; description: string; prompt: string }[] = [
  {
    id: "vibecode",
    label: "Vibecode rebuild (Lovable / v0 / Cursor)",
    description: "Turn this repo into a copy-paste build brief for an AI coding tool to recreate it.",
    prompt:
      "You are a senior product engineer briefing an AI coding tool (Lovable, v0, Cursor, Bolt) to REBUILD the project below from scratch as a modern web app. Using ONLY the repository contents provided, output a single, copy-paste-ready build prompt with these sections, in order:\n\n1. **One-liner** — what the product is, in one sentence.\n2. **Core user flows** — 3–7 bullets, each a concrete user journey (verbs first).\n3. **Feature list** — grouped by area (Auth, Data, UI, Integrations, etc.), each feature one line.\n4. **Tech stack & architecture** — frontend framework, styling, state, backend, database, auth, third-party APIs. Note which to keep vs. swap for the target stack (default target: React + Vite + TypeScript + Tailwind + shadcn/ui + Supabase).\n5. **Data model** — every table/collection with fields, types, and relationships. Infer from code if no schema file exists.\n6. **API surface** — list each endpoint / server action with method, path, input, output.\n7. **Pages & routes** — every route with its purpose and key components.\n8. **Design direction** — colors, typography, spacing, component style, motion. Infer from CSS/Tailwind config and component code. Be specific (hex values, font names, radius scale).\n9. **Environment variables & secrets** — every key the app reads, with a one-line description.\n10. **Build order** — a numbered milestone plan (Milestone 1 → N) the AI tool should follow, each milestone shippable on its own.\n11. **Out of scope** — anything in the repo to deliberately skip in the rebuild.\n\nWrite in imperative voice (\"Build…\", \"Add…\", \"Wire…\"). No fluff, no apologies, no \"as an AI\". Cite file paths inline when a decision comes from a specific file. End with a single fenced code block titled `FINAL_PROMPT` that contains the assembled brief ready to paste into the target AI tool.",
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

export function getTemplatePrompt(id: TemplateId, custom: string): string {
  if (id === "custom") return custom.trim();
  return TEMPLATES.find((t) => t.id === id)?.prompt ?? "";
}
