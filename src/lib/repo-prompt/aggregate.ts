import { fetchRaw, langFor, type TreeNode } from "./github";

const BINARY_EXT = new Set([
  "png","jpg","jpeg","gif","webp","ico","bmp","tiff","svg",
  "pdf","zip","tar","gz","bz2","7z","rar",
  "woff","woff2","ttf","otf","eot",
  "mp3","mp4","mov","avi","wav","ogg","webm","flac",
  "exe","dll","so","dylib","wasm","class","jar","node",
  "psd","ai","sketch","fig",
  "ds_store","lock",
]);

const SKIP_DIRS = new Set([
  "node_modules","dist","build","out",".next",".nuxt",".turbo",".cache",
  "vendor",".git",".idea",".vscode","coverage",".pnpm-store",".yarn",
  "__pycache__",".venv","venv","target","bin","obj","Pods",
]);

const LOCK_FILES = new Set([
  "package-lock.json","yarn.lock","pnpm-lock.yaml","bun.lock","bun.lockb",
  "Gemfile.lock","poetry.lock","Cargo.lock","composer.lock",
]);

export type FileEntry = {
  path: string;
  size: number;
  selected: boolean;
};

export function filterTree(tree: TreeNode[]): FileEntry[] {
  return tree
    .filter((n) => n.type === "blob")
    .filter((n) => {
      const parts = n.path.split("/");
      if (parts.some((p) => SKIP_DIRS.has(p))) return false;
      const base = parts[parts.length - 1];
      if (LOCK_FILES.has(base)) return false;
      const ext = base.includes(".") ? base.split(".").pop()!.toLowerCase() : "";
      if (BINARY_EXT.has(ext)) return false;
      // also skip very large files (> 200KB) by default
      if (typeof n.size === "number" && n.size > 200_000) return false;
      return true;
    })
    .map((n) => ({ path: n.path, size: n.size ?? 0, selected: false }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

const SIGNAL_RE = [
  /^readme(\.|$)/i,
  /^package\.json$/i,
  /^pyproject\.toml$/i,
  /^cargo\.toml$/i,
  /^go\.mod$/i,
  /^makefile$/i,
  /^dockerfile$/i,
  /^tsconfig(\.[\w.-]+)?\.json$/i,
  /^vite\.config\.[tj]s$/i,
  /^next\.config\.[tjm]s$/i,
  /^astro\.config\.[tjm]s$/i,
  /^svelte\.config\.[tj]s$/i,
  /^nuxt\.config\.[tj]s$/i,
  /^remix\.config\.[tj]s$/i,
  /^tailwind\.config\.[tjc]s$/i,
  /^\.env\.example$/i,
  /^requirements\.txt$/i,
  /^setup\.py$/i,
  /^manifest\.json$/i,
];

const SIGNAL_PATH_RE = [
  /^src\/(index|main|app|server)\.[tj]sx?$/i,
  /^src\/app\/page\.tsx?$/i,
  /^src\/routes\/index\.tsx?$/i,
  /^app\/page\.tsx?$/i,
  /^lib\/index\.[tj]s$/i,
];

export function isSignalFile(path: string): boolean {
  const base = path.split("/").pop() ?? "";
  if (SIGNAL_RE.some((r) => r.test(base))) return true;
  if (SIGNAL_PATH_RE.some((r) => r.test(path))) return true;
  return false;
}

export function autoSelectSignals(files: FileEntry[]): FileEntry[] {
  return files.map((f) => ({ ...f, selected: isSignalFile(f.path) }));
}

export type AggregateProgress = {
  done: number;
  total: number;
  current?: string;
};

export type AggregatedFile = { path: string; content: string; truncated?: boolean; error?: string };

export async function fetchFilesBatched(
  owner: string,
  repo: string,
  branch: string,
  paths: string[],
  concurrency = 8,
  onProgress?: (p: AggregateProgress) => void,
  signal?: AbortSignal,
): Promise<AggregatedFile[]> {
  const results: AggregatedFile[] = [];
  let done = 0;
  for (let i = 0; i < paths.length; i += concurrency) {
    if (signal?.aborted) break;
    const slice = paths.slice(i, i + concurrency);
    const settled = await Promise.all(
      slice.map(async (p) => {
        try {
          const content = await fetchRaw(owner, repo, branch, p);
          return { path: p, content };
        } catch (e) {
          return { path: p, content: "", error: e instanceof Error ? e.message : String(e) };
        }
      }),
    );
    for (const r of settled) {
      results.push(r);
      done += 1;
      onProgress?.({ done, total: paths.length, current: r.path });
    }
  }
  return results;
}

export function assemblePrompt(opts: {
  templatePrompt: string;
  systemBlock: string;
  repoLabel: string;
  files: AggregatedFile[];
  maxChars: number;
}): { text: string; chars: number; tokens: number; included: number; truncatedAt?: string } {
  const header = `${opts.templatePrompt}\n\n---\n\n${opts.systemBlock}\n\nRepository: ${opts.repoLabel}\n\n---\n\n`;
  let body = "";
  let included = 0;
  let truncatedAt: string | undefined;

  for (const f of opts.files) {
    if (f.error) {
      body += `### ${f.path}\n\n_[skipped: ${f.error}]_\n\n`;
      continue;
    }
    const lang = langFor(f.path);
    const block = `### ${f.path}\n\n\`\`\`${lang}\n${f.content}\n\`\`\`\n\n`;
    if ((header.length + body.length + block.length) > opts.maxChars) {
      truncatedAt = f.path;
      const remaining = opts.maxChars - (header.length + body.length) - 200;
      if (remaining > 500) {
        const partial = f.content.slice(0, remaining);
        body += `### ${f.path}\n\n\`\`\`${lang}\n${partial}\n\`\`\`\n\n_[TRUNCATED — file exceeds character budget]_\n\n`;
        included += 1;
      } else {
        body += `_[TRUNCATED — remaining files omitted to stay under ${opts.maxChars.toLocaleString()} chars]_\n`;
      }
      break;
    }
    body += block;
    included += 1;
  }

  const text = header + body;
  return {
    text,
    chars: text.length,
    tokens: Math.ceil(text.length / 4),
    included,
    truncatedAt,
  };
}

// Build a structural preview of the prompt WITHOUT fetching file contents.
// Each selected file is shown as a placeholder of roughly its byte size so the
// user gets a faithful char/token estimate and sees how the template wraps the
// files before paying the GitHub round-trip.
export function previewPrompt(opts: {
  templatePrompt: string;
  systemBlock: string;
  repoLabel: string;
  files: { path: string; size: number }[];
  maxChars: number;
}): { text: string; chars: number; tokens: number; included: number; truncatedAt?: string } {
  const header = `${opts.templatePrompt}\n\n---\n\n${opts.systemBlock}\n\nRepository: ${opts.repoLabel}\n\n---\n\n`;
  let body = "";
  let included = 0;
  let truncatedAt: string | undefined;

  for (const f of opts.files) {
    const lang = langFor(f.path);
    const sizeLabel = f.size > 0 ? `${f.size.toLocaleString()} bytes` : "content";
    const placeholder = `[ file contents — ~${sizeLabel} · fetched on Build ]`;
    const block = `### ${f.path}\n\n\`\`\`${lang}\n${placeholder}\n\`\`\`\n\n`;
    // Estimated real cost = block scaffolding + actual file size (capped).
    const scaffold = block.length - placeholder.length;
    const estimated = scaffold + Math.min(f.size || placeholder.length, 200_000);
    if (header.length + body.length + estimated > opts.maxChars) {
      truncatedAt = f.path;
      body += `_[TRUNCATED — remaining files would exceed ${opts.maxChars.toLocaleString()} chars]_\n`;
      break;
    }
    body += block;
    included += 1;
  }

  const text = header + body;
  // Use estimated total (header + scaffolds + raw sizes) for the char counter,
  // since the visible placeholders don't reflect real file weight.
  const estimatedChars =
    header.length +
    opts.files
      .slice(0, included)
      .reduce((acc, f) => {
        const lang = langFor(f.path);
        const scaffold = `### ${f.path}\n\n\`\`\`${lang}\n\n\`\`\`\n\n`.length;
        return acc + scaffold + Math.min(f.size || 0, 200_000);
      }, 0);
  return {
    text,
    chars: estimatedChars,
    tokens: Math.ceil(estimatedChars / 4),
    included,
    truncatedAt,
  };
}
