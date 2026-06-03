export type TemplateId = "vibecode" | "explain" | "readme" | "refactor" | "custom";

export const TEMPLATES: { id: TemplateId; label: string; description: string; prompt: string }[] = [
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
