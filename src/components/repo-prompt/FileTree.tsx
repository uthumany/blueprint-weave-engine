import { useMemo } from "react";
import { ChevronRight, Folder, FileText } from "lucide-react";
import { useState } from "react";
import type { FileEntry } from "@/lib/repo-prompt/aggregate";

type Props = {
  files: FileEntry[];
  onToggle: (path: string) => void;
  onBulk: (mode: "signals" | "all" | "none") => void;
};

type Node = {
  name: string;
  path: string;
  children: Map<string, Node>;
  file?: FileEntry;
};

function buildTree(files: FileEntry[]): Node {
  const root: Node = { name: "", path: "", children: new Map() };
  for (const f of files) {
    const parts = f.path.split("/");
    let cur = root;
    parts.forEach((part, i) => {
      const isFile = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");
      let child = cur.children.get(part);
      if (!child) {
        child = { name: part, path, children: new Map() };
        cur.children.set(part, child);
      }
      if (isFile) child.file = f;
      cur = child;
    });
  }
  return root;
}

function fmtBytes(n: number) {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function FolderRow({
  node,
  depth,
  onToggle,
}: {
  node: Node;
  depth: number;
  onToggle: (p: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const sorted = useMemo(
    () =>
      Array.from(node.children.values()).sort((a, b) => {
        const aDir = !a.file ? 0 : 1;
        const bDir = !b.file ? 0 : 1;
        if (aDir !== bDir) return aDir - bDir;
        return a.name.localeCompare(b.name);
      }),
    [node],
  );

  return (
    <ul className="text-sm">
      {sorted.map((child) => {
        const pad = { paddingLeft: `${depth * 16 + 8}px` };
        if (child.file) {
          const f = child.file;
          return (
            <li key={child.path}>
              <label
                style={pad}
                className="flex items-center gap-2 py-1 pr-2 rounded hover:bg-surface/60 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={f.selected}
                  onChange={() => onToggle(f.path)}
                  className="accent-lime"
                />
                <FileText className="size-3.5 text-muted-foreground shrink-0" />
                <span className="font-mono text-xs truncate flex-1">{child.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground/70 shrink-0">
                  {fmtBytes(f.size)}
                </span>
              </label>
            </li>
          );
        }
        return (
          <li key={child.path}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              style={pad}
              className="w-full flex items-center gap-2 py-1 pr-2 rounded hover:bg-surface/60 text-left"
            >
              <ChevronRight
                className={`size-3.5 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
              />
              <Folder className="size-3.5 text-lime/70 shrink-0" />
              <span className="font-mono text-xs">{child.name}</span>
            </button>
            {open && <FolderRow node={child} depth={depth + 1} onToggle={onToggle} />}
          </li>
        );
      })}
    </ul>
  );
}

export function FileTree({ files, onToggle, onBulk }: Props) {
  const tree = useMemo(() => buildTree(files), [files]);
  const sel = files.filter((f) => f.selected);
  const totalBytes = sel.reduce((a, f) => a + f.size, 0);

  return (
    <div className="rounded-2xl glass p-5 sm:p-6 flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          › files · {files.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onBulk("signals")}
            className="px-2.5 h-7 rounded-md border border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-lime/40"
          >
            signals
          </button>
          <button
            type="button"
            onClick={() => onBulk("all")}
            className="px-2.5 h-7 rounded-md border border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-lime/40"
          >
            all
          </button>
          <button
            type="button"
            onClick={() => onBulk("none")}
            className="px-2.5 h-7 rounded-md border border-border font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-lime/40"
          >
            none
          </button>
        </div>
      </div>

      <p className="mt-2 font-mono text-[11px] text-muted-foreground/80">
        {sel.length} selected · {fmtBytes(totalBytes)} · ~{Math.ceil(totalBytes / 4).toLocaleString()} tokens
      </p>

      <div className="mt-4 -mx-2 overflow-auto max-h-[55vh] rounded-lg border border-border bg-background/30 px-1 py-2">
        <FolderRow node={tree} depth={0} onToggle={onToggle} />
      </div>
    </div>
  );
}
