import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/* eslint-disable @typescript-eslint/no-explicit-any */

async function honcho() {
  return await import("@/lib/honcho/honcho.server");
}

const PeerIdRe = /^[a-zA-Z0-9_-]{1,100}$/;
const peerIdSchema = z.string().regex(PeerIdRe, "invalid peer id");

// Resolve effective peer id — merges anon peer into user peer if both provided.
export const resolvePeer = createServerFn({ method: "POST" })
  .inputValidator((d: { anonId?: string; userId?: string }) =>
    z
      .object({
        anonId: z.string().max(100).optional(),
        userId: z.string().max(100).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { upsertPeer, mergePeers, sanitizePeerId } = await honcho();
    const anon = data.anonId ? sanitizePeerId(`anon_${data.anonId}`) : null;
    const user = data.userId ? sanitizePeerId(`user_${data.userId}`) : null;
    const effective = user ?? anon;
    if (!effective) return { peerId: null as string | null };
    await upsertPeer(effective);
    if (anon && user && anon !== user) {
      await mergePeers(anon, user);
    }
    return { peerId: effective };
  });

export const recordAnalysis = createServerFn({ method: "POST" })
  .inputValidator((d: { peerId: string; source: string; profile: any }) =>
    z
      .object({
        peerId: peerIdSchema,
        source: z.string().max(2048),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profile: z.any(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { addMessages } = await honcho();
    const payload = {
      event: "analysis",
      source: data.source,
      profile: data.profile,
      at: new Date().toISOString(),
    };
    await addMessages("analyze", data.peerId, [JSON.stringify(payload)]);
    return { ok: true };
  });

export const recordFeedback = createServerFn({ method: "POST" })
  .inputValidator((d: { peerId: string; source: string; kept: boolean; note?: string }) =>
    z
      .object({
        peerId: peerIdSchema,
        source: z.string().max(2048),
        kept: z.boolean(),
        note: z.string().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { addMessages } = await honcho();
    await addMessages("analyze", data.peerId, [
      JSON.stringify({ event: "feedback", ...data, at: new Date().toISOString() }),
    ]);
    return { ok: true };
  });

// Ask Honcho's dialectic API for the user's learned preferences as JSON.
export const getPreferences = createServerFn({ method: "POST" })
  .inputValidator((d: { peerId: string }) => z.object({ peerId: peerIdSchema }).parse(d))
  .handler(async ({ data }) => {
    const { dialecticChat } = await honcho();
    const q = `Based on this user's past design-DNA analyses and feedback, return ONLY a JSON object like:
{"moods":string[],"palettes":string[],"typography":string[],"sources":string[],"summary":string}
Keep each array to <=6 items. If nothing is known yet, return empty arrays and an empty summary.`;
    const raw = await dialecticChat(data.peerId, q);
    if (!raw) return { preferences: null as any };
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end <= start) return { preferences: null as any };
    try {
      return { preferences: JSON.parse(raw.slice(start, end + 1)) };
    } catch {
      return { preferences: null as any };
    }
  });

export const listRecentSources = createServerFn({ method: "POST" })
  .inputValidator((d: { peerId: string; limit?: number }) =>
    z.object({ peerId: peerIdSchema, limit: z.number().int().min(1).max(20).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { dialecticChat } = await honcho();
    const q = `Return ONLY a JSON array of the ${data.limit ?? 5} most recent distinct source URLs or domains this user analyzed, newest first. Example: ["linear.app","https://stripe.com"]. Empty array if none.`;
    const raw = await dialecticChat(data.peerId, q);
    if (!raw) return { sources: [] as string[] };
    const start = raw.indexOf("[");
    const end = raw.lastIndexOf("]");
    if (start === -1 || end <= start) return { sources: [] as string[] };
    try {
      const arr = JSON.parse(raw.slice(start, end + 1));
      return { sources: Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, 20) : [] };
    } catch {
      return { sources: [] as string[] };
    }
  });
