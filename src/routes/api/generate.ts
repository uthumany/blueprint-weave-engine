import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const BodySchema = z.object({
  profile: z.string().min(1).max(50_000),
  content: z.string().min(1).max(20_000),
});

const GENERATE_SYSTEM = `You are a pixel-faithful UI generator. Given a design system profile (JSON) and user content (markdown), generate a SINGLE self-contained HTML file that:
1. Uses the EXACT colors, typography, spacing, and effects from the profile
2. Imports Google Fonts for the specified typefaces
3. Is fully responsive (mobile-first)
4. Uses proper semantic HTML
5. Has modern, clean styling matching the profile's mood
6. Includes a subtle dark/light mode based on the profile's palette
7. Is a complete, valid HTML document with <!DOCTYPE html>
8. Uses the profile's motion/easing for any animations

Return ONLY the HTML code wrapped in \`\`\`html ... \`\`\` — no prose, no explanation.`;

export const Route = createFileRoute("/api/generate")({
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
        const { profile: profileJson, content } = parsed.data;
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) {
          return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
            status: 500,
            headers: { "content-type": "application/json" },
          });
        }

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const enc = (obj: unknown) =>
              new TextEncoder().encode(`data: ${JSON.stringify(obj)}\n\n`);

            try {
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
                    { role: "system", content: GENERATE_SYSTEM },
                    {
                      role: "user",
                      content: `Design Profile:\n${profileJson}\n\nContent to render:\n${content}`,
                    },
                  ],
                }),
              });

              if (!aiRes.ok || !aiRes.body) {
                const t = await aiRes.text().catch(() => "");
                controller.enqueue(enc({ type: "error", message: `AI gateway ${aiRes.status}: ${t.slice(0, 200)}` }));
                controller.close();
                return;
              }

              const reader = aiRes.body.getReader();
              const dec = new TextDecoder();
              let buf = "";
              let raw = "";

              while (true) {
                const { done, value: chunk } = await reader.read();
                if (done) break;
                buf += dec.decode(chunk, { stream: true });
                let nl;
                while ((nl = buf.indexOf("\n")) !== -1) {
                  const line = buf.slice(0, nl);
                  buf = buf.slice(nl + 1);
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") break;
                  try {
                    const parsedChunk = JSON.parse(data);
                    const delta = parsedChunk.choices?.[0]?.delta?.content;
                    if (typeof delta === "string") {
                      raw += delta;
                      controller.enqueue(enc({ type: "chunk", text: delta }));
                    }
                  } catch { /* skip */ }
                }
              }

              // Extract HTML from code fence
              const htmlMatch = raw.match(/```html\s*([\s\S]*?)```/);
              const html = htmlMatch ? htmlMatch[1].trim() : raw.trim();

              controller.enqueue(enc({ type: "result", html }));
              controller.enqueue(enc({ type: "done" }));
              controller.close();
            } catch (err) {
              const message = err instanceof Error ? err.message : "Unknown error";
              controller.enqueue(enc({ type: "error", message }));
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
