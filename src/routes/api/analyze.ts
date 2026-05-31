import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  kind: z.enum(["url", "image-url"]),
  // image-url may be a data URL (base64), so allow large payloads
  value: z.string().min(1).max(12_000_000),
});

const SYSTEM = `You are a forensic visual design analyzer. Given a screenshot of a website, extract its complete visual DNA.
Return ONLY a JSON object (no prose, no fences) with this exact shape:
{
  "mood": string[],                     // 2-4 short tags: e.g. ["futuristic","minimal","dark"]
  "palette": { "name": string, "hex": string, "role": "bg"|"surface"|"text"|"muted"|"accent"|"accent-2" }[],
  "typography": { "display": string, "body": string, "mono"?: string, "scale": string[] },
  "spacing": { "base": number, "scale": number[] },
  "radius":  { "sm": number, "md": number, "lg": number, "full": number },
  "effects": { "shadow": string, "blur": string, "noise": boolean, "grain": boolean },
  "motion":  { "ease": string, "duration_ms": number },
  "confidence": number                  // 0..1
}`;

function sseEvent(obj: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);
}

function thumIoFallback(url: string): string {
  // free, key-less screenshot service used as graceful fallback
  return `https://image.thum.io/get/width/1280/crop/1600/noanimate/${url}`;
}

async function fetchScreenshot(
  url: string,
  log: (line: string, k?: "ok" | "warn" | "done") => void,
): Promise<string> {
  try {
    const jsonRes = await fetch(
      `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`,
      { headers: { Accept: "application/json" } },
    );
    if (jsonRes.ok) {
      const json = (await jsonRes.json()) as {
        status: string;
        data?: { screenshot?: { url?: string } };
      };
      const shot = json?.data?.screenshot?.url;
      if (shot) return shot;
      log("microlink · empty response, falling back to thum.io", "warn");
    } else if (jsonRes.status === 429) {
      log("microlink · rate-limited (429), falling back to thum.io", "warn");
    } else {
      log(`microlink · ${jsonRes.status}, falling back to thum.io`, "warn");
    }
  } catch (err) {
    log(`microlink · network error, falling back to thum.io`, "warn");
  }
  return thumIoFallback(url);
}

export const Route = createFileRoute("/api/analyze")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = BodySchema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) {
          return new Response(JSON.stringify({ error: "Invalid body" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }
        const { kind, value } = parsed.data;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const t0 = Date.now();
            const ts = () => ((Date.now() - t0) / 1000).toFixed(2).padStart(5, "0");
            const log = (line: string, k: "ok" | "warn" | "done" = "ok") =>
              controller.enqueue(sseEvent({ type: "log", t: ts(), k, c: line }));

            try {
              let imageUrl = value;
              let publicShot: string | null = null;
              if (kind === "url") {
                log(`GET screenshot · microlink.io`);
                imageUrl = await fetchScreenshot(value, log);
                publicShot = imageUrl;
                log(`screenshot ready · ${imageUrl.slice(0, 48)}…`);
              } else if (value.startsWith("data:")) {
                log(`decoded upload · ${(value.length / 1024).toFixed(0)} kB`);
              } else {
                publicShot = value;
                log(`using direct image · ${value.slice(0, 48)}…`);
              }

              log(`handoff → gemini-2.5-pro (vision)`, "warn");

              const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-pro",
                  stream: true,
                  messages: [
                    { role: "system", content: SYSTEM },
                    {
                      role: "user",
                      content: [
                        { type: "text", text: "Extract the design DNA of this interface as JSON." },
                        { type: "image_url", image_url: { url: imageUrl } },
                      ],
                    },
                  ],
                }),
              });

              if (!aiRes.ok || !aiRes.body) {
                if (aiRes.status === 429) {
                  controller.enqueue(sseEvent({ type: "error", message: "Rate limited. Try again shortly." }));
                } else if (aiRes.status === 402) {
                  controller.enqueue(sseEvent({ type: "error", message: "AI credits exhausted. Add funds in Workspace → Usage." }));
                } else {
                  const t = await aiRes.text().catch(() => "");
                  controller.enqueue(sseEvent({ type: "error", message: `AI gateway ${aiRes.status}: ${t.slice(0, 200)}` }));
                }
                controller.close();
                return;
              }

              log(`streaming tokens · parsing model output`);

              const reader = aiRes.body.getReader();
              const dec = new TextDecoder();
              let buf = "";
              let raw = "";
              let lastEmit = 0;
              const milestones = [
                { at: 120, line: "color system · resolving tokens" },
                { at: 320, line: "typography · detecting font stack" },
                { at: 560, line: "spacing scale · inferring base" },
                { at: 820, line: "effects · shadow + blur signatures" },
                { at: 1100, line: "motion · ease curves + durations" },
              ];
              let mIdx = 0;

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
                    const parsedChunk = JSON.parse(data);
                    const delta = parsedChunk.choices?.[0]?.delta?.content;
                    if (typeof delta === "string") {
                      raw += delta;
                      while (mIdx < milestones.length && raw.length >= milestones[mIdx].at) {
                        log(milestones[mIdx].line);
                        mIdx++;
                      }
                      const now = Date.now();
                      if (now - lastEmit > 80) {
                        controller.enqueue(sseEvent({ type: "tokens", n: raw.length }));
                        lastEmit = now;
                      }
                    }
                  } catch {
                    /* skip partial */
                  }
                }
              }

              const start = raw.indexOf("{");
              const end = raw.lastIndexOf("}");
              let profile: unknown = null;
              if (start !== -1 && end > start) {
                try {
                  profile = JSON.parse(raw.slice(start, end + 1));
                } catch {
                  profile = null;
                }
              }

              if (!profile) {
                log("profile parse failed", "warn");
                controller.enqueue(sseEvent({ type: "error", message: "Model returned unparseable JSON." }));
                controller.close();
                return;
              }

              log(`profile.dna.json ✓ saved`, "done");
              controller.enqueue(sseEvent({ type: "profile", data: profile, screenshot: publicShot }));
              controller.enqueue(sseEvent({ type: "done" }));
              controller.close();
            } catch (err) {
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
