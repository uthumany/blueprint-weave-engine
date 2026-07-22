import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import type { DnaProfile, ButtonSpec, FontInfo } from "@/lib/analyzer/schema";

const BodySchema = z.object({
  kind: z.enum(["url", "image-url"]),
  value: z.string().min(1).max(12_000_000),
  peerId: z.string().max(120).optional(),
});

/* eslint-disable @typescript-eslint/no-explicit-any */

const VISION_SYSTEM = `You are a forensic visual design analyzer. You'll receive a screenshot AND deterministic CSS tokens already extracted from the site's stylesheets.
Return ONLY a JSON object (no fences) with:
{
  "roles": { "bg": string, "bgSecondary": string, "text": string, "textSecondary": string, "primary": string, "secondary": string, "border": string },
  "mood": string,                    // one sentence
  "tags": string[],                  // 3-6 short tags
  "confidence": number               // 0..1
}
The role values MUST be hex strings picked from the provided palette. Do not invent new hex values.`;

function sseEvent(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}
function thumIoFallback(url: string): string {
  return `https://image.thum.io/get/width/1280/crop/1600/noanimate/${url}`;
}
async function fetchScreenshot(url: string, log: (line: string, k?: "ok" | "warn" | "done") => void): Promise<string> {
  try {
    const r = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`, { headers: { Accept: "application/json" } });
    if (r.ok) {
      const j = (await r.json()) as { data?: { screenshot?: { url?: string } } };
      const shot = j?.data?.screenshot?.url;
      if (shot) return shot;
      log("microlink · empty response, falling back to thum.io", "warn");
    } else {
      log(`microlink · ${r.status}, falling back to thum.io`, "warn");
    }
  } catch {
    log("microlink · network error, falling back to thum.io", "warn");
  }
  return thumIoFallback(url);
}

function classifyButtons(specs: ButtonSpec[]): { primary: ButtonSpec | null; rest: ButtonSpec[] } {
  const filled = specs.filter((b) => b.variant === "filled" && b.bg && b.bg !== "transparent");
  const primary = filled[0] ?? null;
  const rest = specs.filter((b) => b !== primary).slice(0, 8);
  return { primary, rest };
}

function assembleUrlProfile(det: any, ai: any, url: string): DnaProfile {
  const roles = ai?.roles ?? {};
  const palette = det.palette ?? [];
  const pick = (i: number) => palette[i]?.hex ?? "#000000";
  const bg = roles.bg ?? pick(0);
  const text = roles.text ?? pick(1);
  const primary = roles.primary ?? pick(2);
  const secondary = roles.secondary ?? pick(3);
  const border = roles.border ?? pick(4);
  const bgSecondary = roles.bgSecondary ?? pick(5);
  const textSecondary = roles.textSecondary ?? pick(6);

  const { primary: primaryButton, rest } = classifyButtons(det.buttons ?? []);

  const headingFont: FontInfo = det.typography.headingFont ?? {
    family: "sans-serif", cleanFamily: "sans-serif", weights: [], usedFor: "heading", fallback: "sans-serif",
  };
  const bodyFont: FontInfo = det.typography.bodyFont ?? headingFont;
  // Attach @font-face URLs
  const faceFor = (fam: string) => det.fontFaces?.find((f: any) => f.family.toLowerCase() === fam.toLowerCase());
  if (headingFont && !headingFont.realUrl) {
    const f = faceFor(headingFont.cleanFamily);
    if (f?.src) headingFont.realUrl = f.src;
  }
  if (bodyFont && !bodyFont.realUrl) {
    const f = faceFor(bodyFont.cleanFamily);
    if (f?.src) bodyFont.realUrl = f.src;
  }

  return {
    url,
    title: det.title,
    description: det.description,
    scrapedAt: new Date().toISOString(),
    colors: {
      bg, bgSecondary, text, textSecondary, primary, secondary, border,
      palette,
    },
    typography: {
      headingFont, bodyFont,
      fontSizes: det.typography.fontSizes ?? [],
      lineHeights: det.typography.lineHeights ?? [],
      details: det.typography.details ?? [],
    },
    spacing: det.spacing,
    borderRadius: det.borderRadius,
    shadows: det.shadows,
    components: { primaryButton, buttons: rest, card: null },
    fontFaces: det.fontFaces ?? [],
    cssCustomProperties: det.cssCustomProperties ?? [],
    tags: ai?.tags ?? ["extracted"],
    mood: ai?.mood ?? "Extracted visual system.",
    heroHeadline: det.heroHeadline,
    heroSubtitle: det.heroSubtitle,
    confidence: typeof ai?.confidence === "number" ? ai.confidence : 0.85,
  };
}

function assembleImageProfile(ai: any, sourceLabel: string): DnaProfile {
  const roles = ai?.roles ?? {};
  const palette = (ai?.palette ?? []).map((p: any) => ({
    hex: p.hex, role: p.role ?? "block", count: 1, contrast: p.contrast ?? "dark",
  }));
  const pick = (i: number) => palette[i]?.hex ?? "#000000";
  return {
    scrapedAt: new Date().toISOString(),
    title: sourceLabel,
    colors: {
      bg: roles.bg ?? pick(0),
      bgSecondary: roles.bgSecondary ?? pick(1),
      text: roles.text ?? pick(2),
      textSecondary: roles.textSecondary ?? pick(3),
      primary: roles.primary ?? pick(4),
      secondary: roles.secondary ?? pick(5),
      border: roles.border ?? pick(6),
      palette,
    },
    typography: {
      headingFont: { family: ai?.typography?.display ?? "sans-serif", cleanFamily: ai?.typography?.display ?? "sans-serif", weights: [], usedFor: "heading", fallback: "sans-serif" },
      bodyFont: { family: ai?.typography?.body ?? "sans-serif", cleanFamily: ai?.typography?.body ?? "sans-serif", weights: [], usedFor: "body", fallback: "sans-serif" },
      fontSizes: (ai?.typography?.scale ?? []).map((s: any) => Number(s)).filter(Number.isFinite),
      lineHeights: [],
      details: [],
    },
    spacing: { base: ai?.spacing?.base ?? 8, common: (ai?.spacing?.scale ?? []).map((v: number) => ({ value: v, count: 1, role: "element" })) },
    borderRadius: ai?.radius ? Object.entries(ai.radius).map(([k, v]) => ({ value: Number(v), count: 1, role: k })) : [],
    shadows: ai?.effects?.shadow ? [{ value: ai.effects.shadow, count: 1, level: "medium" }] : [],
    components: { primaryButton: null, buttons: [], card: null },
    fontFaces: [],
    cssCustomProperties: [],
    tags: ai?.tags ?? ai?.mood ?? [],
    mood: Array.isArray(ai?.mood) ? ai.mood.join(", ") : (ai?.mood ?? "Visual system extracted from image."),
    confidence: typeof ai?.confidence === "number" ? ai.confidence : 0.75,
  };
}

const IMAGE_SYSTEM = `You are a forensic visual design analyzer. Given a screenshot, extract its complete visual DNA.
Return ONLY a JSON object with:
{
  "roles": { "bg": string, "bgSecondary": string, "text": string, "textSecondary": string, "primary": string, "secondary": string, "border": string },
  "palette": { "hex": string, "role": "block"|"text-accent"|"border", "contrast": "light"|"dark" }[],
  "typography": { "display": string, "body": string, "scale": number[] },
  "spacing": { "base": number, "scale": number[] },
  "radius": { "sm": number, "md": number, "lg": number, "full": number },
  "effects": { "shadow": string },
  "mood": string, "tags": string[], "confidence": number
}`;

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = BodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response(JSON.stringify({ error: "Invalid body" }), { status: 400, headers: { "content-type": "application/json" } });
        const { kind, value, peerId } = parsed.data;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), { status: 500, headers: { "content-type": "application/json" } });

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const t0 = Date.now();
            const ts = () => ((Date.now() - t0) / 1000).toFixed(2).padStart(5, "0");
            const log = (line: string, k: "ok" | "warn" | "done" = "ok") => controller.enqueue(sseEvent({ type: "log", t: ts(), k, c: line }));
            const phase = (id: string, label: string, pct: number) => controller.enqueue(sseEvent({ type: "phase", id, label, pct, elapsed: Date.now() - t0 }));
            const tick = () => controller.enqueue(sseEvent({ type: "tick", elapsed: Date.now() - t0 }));
            let heartbeat: ReturnType<typeof setInterval> | null = null;
            const stopHeartbeat = () => { if (heartbeat) { clearInterval(heartbeat); heartbeat = null; } };
            const startHeartbeat = () => { stopHeartbeat(); heartbeat = setInterval(() => { try { tick(); } catch { /* noop */ } }, 500); };

            try {
              // ---------- STAGE 1: capture + extract (URL only) ----------
              let deterministic: any = null;
              let publicShot: string | null = null;
              let imageUrl = value;

              if (kind === "url") {
                phase("capture", "Capturing specimen", 5);
                log(`GET screenshot · microlink.io`);
                imageUrl = await fetchScreenshot(value, log);
                publicShot = imageUrl;
                log(`screenshot ready`);

                phase("extract", "Extracting CSS tokens", 15);
                try {
                  const { extractFromUrl } = await import("@/lib/analyzer/extract.server");
                  deterministic = await extractFromUrl(value);
                  log(`palette · ${deterministic.palette.length} unique hex`);
                  log(`fontFaces · ${deterministic.fontFaces.length} @font-face`);
                  log(`custom properties · ${deterministic.cssCustomProperties.length} tokens`);
                  log(`font-sizes · ${deterministic.typography.fontSizes.length} distinct`);
                  log(`spacing · ${deterministic.spacing.common.length} tokens (base ${deterministic.spacing.base}px)`);
                  log(`radius · ${deterministic.borderRadius.length} tokens`);
                  log(`shadows · ${deterministic.shadows.length}`);
                  log(`buttons · ${deterministic.buttons.length} candidates`);
                } catch (e) {
                  log(`extract · failed (${(e as Error).message.slice(0, 60)})`, "warn");
                }
              } else if (value.startsWith("data:")) {
                log(`decoded upload · ${(value.length / 1024).toFixed(0)} kB`);
              } else {
                publicShot = value;
                log(`using direct image · ${value.slice(0, 48)}…`);
              }

              phase("handoff", "Handing off to vision model", 25);

              // ---------- Memory preferences ----------
              let systemMsg = kind === "url" ? VISION_SYSTEM : IMAGE_SYSTEM;
              let appliedPrefs: unknown = null;
              if (peerId) {
                try {
                  const { dialecticChat, upsertPeer } = await import("@/lib/honcho/honcho.server");
                  await upsertPeer(peerId);
                  const q = `Return ONLY JSON {"moods":string[],"palettes":string[],"typography":string[],"summary":string}. Empty if unknown.`;
                  const raw = await dialecticChat(peerId, q);
                  if (raw) {
                    const s = raw.indexOf("{"); const e = raw.lastIndexOf("}");
                    if (s !== -1 && e > s) { try { appliedPrefs = JSON.parse(raw.slice(s, e + 1)); } catch { /* noop */ } }
                  }
                  if (appliedPrefs) {
                    log("memory · applying learned preferences", "ok");
                    systemMsg = `${systemMsg}\n\nUSER PREFERENCE PRIOR: ${JSON.stringify(appliedPrefs).slice(0, 800)}`;
                    controller.enqueue(sseEvent({ type: "memory", preferences: appliedPrefs }));
                  }
                } catch (e) {
                  log(`memory · unavailable (${(e as Error).message.slice(0, 60)})`, "warn");
                }
              }

              // Build user message
              const userText = kind === "url" && deterministic
                ? `Assign semantic roles from these extracted tokens and infer the mood.\n\nEXTRACTED PALETTE (rank ordered): ${deterministic.palette.slice(0, 12).map((p: any) => p.hex).join(", ")}\nHEADING FONT: ${deterministic.typography.headingFont?.cleanFamily ?? "?"}\nBODY FONT: ${deterministic.typography.bodyFont?.cleanFamily ?? "?"}\nTITLE: ${deterministic.title}\n\nUse the screenshot to decide which hex is primary, background, text, etc.`
                : "Extract the design DNA of this interface as JSON.";

              phase("thinking", "Model reasoning", 35);
              startHeartbeat();

              const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                  model: "google/gemini-2.5-pro",
                  stream: true,
                  messages: [
                    { role: "system", content: systemMsg },
                    { role: "user", content: [{ type: "text", text: userText }, { type: "image_url", image_url: { url: imageUrl } }] },
                  ],
                }),
              });

              if (!aiRes.ok || !aiRes.body) {
                stopHeartbeat();
                const msg = aiRes.status === 429 ? "Rate limited. Try again shortly."
                  : aiRes.status === 402 ? "AI credits exhausted."
                  : `AI gateway ${aiRes.status}`;
                controller.enqueue(sseEvent({ type: "error", message: msg }));
                controller.close();
                return;
              }

              const reader = aiRes.body.getReader();
              const dec = new TextDecoder();
              let buf = "";
              let raw = "";
              let lastEmit = 0;
              let streamingStarted = false;

              while (true) {
                const { done, value: chunk } = await reader.read();
                if (done) break;
                buf += dec.decode(chunk, { stream: true });
                let nl;
                while ((nl = buf.indexOf("\n")) !== -1) {
                  let line = buf.slice(0, nl);
                  buf = buf.slice(nl + 1);
                  if (line.endsWith("\r")) line = line.slice(0, -1);
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") break;
                  try {
                    const j = JSON.parse(data);
                    const delta = j.choices?.[0]?.delta?.content;
                    if (typeof delta === "string") {
                      if (!streamingStarted) {
                        streamingStarted = true;
                        stopHeartbeat();
                        phase("streaming", "Streaming role assignments", 55);
                        log("streaming tokens · parsing model output");
                      }
                      raw += delta;
                      const now = Date.now();
                      if (now - lastEmit > 80) {
                        controller.enqueue(sseEvent({ type: "tokens", n: raw.length }));
                        lastEmit = now;
                      }
                    }
                  } catch { /* skip */ }
                }
              }

              stopHeartbeat();
              phase("parsing", "Assembling profile", 90);

              const s = raw.indexOf("{");
              const e = raw.lastIndexOf("}");
              let ai: any = null;
              if (s !== -1 && e > s) {
                try { ai = JSON.parse(raw.slice(s, e + 1)); } catch { ai = null; }
              }
              if (!ai) {
                log("ai parse failed — using deterministic fallback", "warn");
                ai = {};
              }

              let profile: DnaProfile;
              if (kind === "url" && deterministic) {
                profile = assembleUrlProfile(deterministic, ai, value);
              } else {
                profile = assembleImageProfile(ai, kind === "url" ? value : "upload");
              }

              log(`profile assembled · ${profile.colors.palette.length} palette · ${profile.fontFaces.length} @font-face`, "done");
              phase("done", "Profile ready", 100);
              controller.enqueue(sseEvent({ type: "profile", data: profile, screenshot: publicShot }));

              // Persist to memory
              if (peerId) {
                try {
                  const { addMessages } = await import("@/lib/honcho/honcho.server");
                  await addMessages("analyze", peerId, [JSON.stringify({ event: "analysis", source: kind === "url" ? value : "upload", profile, at: new Date().toISOString() })]);
                  log("memory · stored analysis", "ok");
                } catch (err) {
                  log(`memory · store failed (${(err as Error).message.slice(0, 60)})`, "warn");
                }
              }

              controller.enqueue(sseEvent({ type: "done" }));
              controller.close();
            } catch (err) {
              stopHeartbeat();
              const message = err instanceof Error ? err.message : "Unknown error";
              controller.enqueue(sseEvent({ type: "log", t: "--.--", k: "warn", c: `error · ${message}` }));
              controller.enqueue(sseEvent({ type: "error", message }));
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache, no-transform",
            "x-accel-buffering": "no",
          },
        });
      },
    },
  },
});
