// Server-only Honcho REST wrapper. Fails soft — never throws to the caller.
// Docs: https://api.honcho.dev/openapi.json (v3).

const BASE = "https://api.honcho.dev/v3";
const WORKSPACE = process.env.HONCHO_WORKSPACE ?? "notepadify";

function key(): string | null {
  return process.env.HONCHO_API_KEY ?? null;
}

async function req<T = unknown>(
  path: string,
  init: RequestInit & { silent?: boolean } = {},
): Promise<T | null> {
  const k = key();
  if (!k) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${k}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      if (!init.silent) {
        const t = await res.text().catch(() => "");
        console.warn(`[honcho] ${res.status} ${path} ${t.slice(0, 200)}`);
      }
      return null;
    }
    if (res.status === 204) return null;
    return (await res.json()) as T;
  } catch (e) {
    console.warn(`[honcho] network`, (e as Error).message);
    return null;
  }
}

let workspaceReady: Promise<void> | null = null;
export function ensureWorkspace(): Promise<void> {
  if (!workspaceReady) {
    workspaceReady = req("/workspaces", {
      method: "POST",
      body: JSON.stringify({ id: WORKSPACE }),
      silent: true,
    }).then(() => {});
  }
  return workspaceReady;
}

export function sanitizePeerId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100) || "anon";
}

export async function upsertPeer(peerId: string, metadata?: Record<string, unknown>) {
  await ensureWorkspace();
  return req(`/workspaces/${WORKSPACE}/peers`, {
    method: "POST",
    body: JSON.stringify({ id: peerId, metadata: metadata ?? {} }),
    silent: true,
  });
}

export async function ensureSession(sessionId: string, peerId: string) {
  await ensureWorkspace();
  return req(`/workspaces/${WORKSPACE}/sessions`, {
    method: "POST",
    body: JSON.stringify({
      id: sessionId,
      peers: { [peerId]: { observe_me: true } },
    }),
    silent: true,
  });
}

export async function addMessages(
  sessionId: string,
  peerId: string,
  contents: string[],
) {
  if (!contents.length) return null;
  await ensureSession(sessionId, peerId);
  return req(
    `/workspaces/${WORKSPACE}/sessions/${encodeURIComponent(sessionId)}/messages`,
    {
      method: "POST",
      body: JSON.stringify({
        messages: contents.slice(0, 100).map((c) => ({
          peer_id: peerId,
          content: c.slice(0, 24000),
        })),
      }),
      silent: true,
    },
  );
}

export async function dialecticChat(
  peerId: string,
  query: string,
): Promise<string | null> {
  await ensureWorkspace();
  const r = await req<{ content?: string; response?: string; message?: string }>(
    `/workspaces/${WORKSPACE}/peers/${encodeURIComponent(peerId)}/chat`,
    {
      method: "POST",
      body: JSON.stringify({ query: query.slice(0, 9500), stream: false }),
      silent: true,
    },
  );
  if (!r) return null;
  return r.content ?? r.response ?? r.message ?? null;
}

export async function mergePeers(fromPeer: string, toPeer: string) {
  // Honcho has no first-class merge; approximate by tagging the anon peer's
  // metadata with the target user id — dialectic queries can then pull both.
  await upsertPeer(fromPeer, { merged_into: toPeer, merged_at: new Date().toISOString() });
  await upsertPeer(toPeer, { merged_from: fromPeer });
  return { fromPeer, toPeer };
}
