export type ParsedRepo = { owner: string; repo: string; branch?: string };

export type RepoInfo = {
  owner: string;
  repo: string;
  default_branch: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
  private: boolean;
};

export type TreeNode = {
  path: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
};

export class GhError extends Error {
  status: number;
  rateLimited: boolean;
  resetEpoch?: number;
  constructor(message: string, status: number, opts?: { rateLimited?: boolean; resetEpoch?: number }) {
    super(message);
    this.status = status;
    this.rateLimited = !!opts?.rateLimited;
    this.resetEpoch = opts?.resetEpoch;
  }
}

const URL_RE =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+?)(?:\.git)?(?:\/(?:tree|blob)\/([^/]+))?(?:\/.*)?\/?$/i;

export function parseRepoUrl(input: string): ParsedRepo | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const m = trimmed.match(URL_RE);
  if (!m) return null;
  const [, owner, repo, branch] = m;
  if (!owner || !repo) return null;
  return { owner, repo: repo.replace(/\.git$/, ""), branch };
}

async function gh<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/vnd.github+json" } });
  if (!res.ok) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    const reset = res.headers.get("x-ratelimit-reset");
    const rateLimited = res.status === 403 && remaining === "0";
    let msg = `GitHub API ${res.status}`;
    try {
      const j = await res.json();
      if (j?.message) msg = j.message;
    } catch {}
    throw new GhError(msg, res.status, {
      rateLimited,
      resetEpoch: reset ? Number(reset) : undefined,
    });
  }
  return res.json() as Promise<T>;
}

export async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  return gh<RepoInfo>(`https://api.github.com/repos/${owner}/${repo}`);
}

export async function fetchTree(
  owner: string,
  repo: string,
  branch: string,
): Promise<{ tree: TreeNode[]; truncated: boolean }> {
  const data = await gh<{ tree: TreeNode[]; truncated: boolean }>(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
  );
  return { tree: data.tree, truncated: data.truncated };
}

export async function fetchRaw(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${path
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  const res = await fetch(url);
  if (!res.ok) throw new GhError(`raw ${res.status} for ${path}`, res.status);
  return res.text();
}

/** Map file extension → fenced code block language tag. */
export function langFor(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "ts", tsx: "tsx", js: "js", jsx: "jsx", mjs: "js", cjs: "js",
    py: "python", rb: "ruby", go: "go", rs: "rust", java: "java",
    kt: "kotlin", swift: "swift", c: "c", h: "c", cc: "cpp", cpp: "cpp", hpp: "cpp",
    cs: "csharp", php: "php", sh: "bash", bash: "bash", zsh: "bash",
    json: "json", yml: "yaml", yaml: "yaml", toml: "toml", xml: "xml",
    md: "md", mdx: "md", html: "html", css: "css", scss: "scss",
    sql: "sql", graphql: "graphql", proto: "proto", dockerfile: "dockerfile",
    makefile: "makefile",
  };
  const base = path.split("/").pop()?.toLowerCase() ?? "";
  if (base === "dockerfile") return "dockerfile";
  if (base === "makefile") return "makefile";
  return map[ext] ?? "";
}
