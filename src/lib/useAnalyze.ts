import { useCallback, useRef, useState } from "react";
import type { LogLine } from "@/components/ExtractionLog";

type AnalyzeKind = "url" | "screenshot" | "image-url";

export type DnaProfile = {
  mood: string[];
  palette: { name: string; hex: string; role: string }[];
  typography: { display: string; body: string; mono?: string; scale: string[] };
  spacing: { base: number; scale: number[] };
  radius: { sm: number; md: number; lg: number; full: number };
  effects: { shadow: string; blur: string; noise: boolean; grain: boolean };
  motion: { ease: string; duration_ms: number };
  confidence: number;
};

export function useAnalyze() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [live, setLive] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [profile, setProfile] = useState<DnaProfile | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => {
    setLines([]);
    setTokens(0);
    setProfile(null);
    setScreenshot(null);
    setError(null);
  };

  const analyze = useCallback(async (kind: AnalyzeKind, value: string) => {
    if (kind === "screenshot") {
      setError("Direct screenshot upload coming soon — try a URL or image link.");
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    reset();
    setLive(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, value }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(`analyze failed (${res.status}) ${t.slice(0, 120)}`);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        buf += dec.decode(chunk, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n\n")) !== -1) {
          const evt = buf.slice(0, nl);
          buf = buf.slice(nl + 2);
          for (const raw of evt.split("\n")) {
            if (!raw.startsWith("data: ")) continue;
            try {
              const msg = JSON.parse(raw.slice(6));
              if (msg.type === "log") {
                setLines((prev) => [...prev, { t: msg.t, c: msg.c, k: msg.k }]);
              } else if (msg.type === "tokens") {
                setTokens(msg.n);
              } else if (msg.type === "profile") {
                setProfile(msg.data as DnaProfile);
                if (msg.screenshot) setScreenshot(msg.screenshot);
              } else if (msg.type === "error") {
                setError(msg.message);
              } else if (msg.type === "done") {
                setLive(false);
              }
            } catch {
              /* ignore */
            }
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        setError(e instanceof Error ? e.message : "Unknown error");
      }
    } finally {
      setLive(false);
    }
  }, []);

  return { analyze, lines, live, tokens, profile, screenshot, error };
}
