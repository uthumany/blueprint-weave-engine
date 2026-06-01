import { useCallback, useRef, useState } from "react";
import type { LogLine } from "@/components/ExtractionLog";

export type AnalyzeKind = "url" | "screenshot" | "image-url";

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

export type AnalyzeInput = string | File;

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
}

export type PhaseId = "capture" | "handoff" | "thinking" | "streaming" | "parsing" | "done";
export type PhaseState = { id: PhaseId; label: string; pct: number; elapsed: number };

export function useAnalyze() {
  const [lines, setLines] = useState<LogLine[]>([]);
  const [live, setLive] = useState(false);
  const [tokens, setTokens] = useState(0);
  const [profile, setProfile] = useState<DnaProfile | null>(null);
  const [source, setSource] = useState<{ kind: AnalyzeKind; label: string } | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<PhaseState | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const reset = () => {
    setLines([]);
    setTokens(0);
    setProfile(null);
    setScreenshot(null);
    setError(null);
    setPhase(null);
    setElapsedMs(0);
  };


  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLive(false);
  }, []);

  const analyze = useCallback(async (kind: AnalyzeKind, value: AnalyzeInput) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    reset();
    setLive(true);

    let payloadKind: "url" | "image-url" = kind === "url" ? "url" : "image-url";
    let payloadValue: string;
    let label: string;
    let localPreview: string | null = null;

    try {
      if (value instanceof File) {
        if (value.size > MAX_UPLOAD_BYTES) {
          throw new Error("File too large — max 8 MB.");
        }
        payloadValue = await fileToDataUrl(value);
        localPreview = payloadValue;
        label = value.name;
      } else {
        payloadValue = value.trim();
        label = payloadValue;
        if (kind === "image-url") localPreview = payloadValue;
      }
      setSource({ kind, label });
      if (localPreview) setScreenshot(localPreview);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: payloadKind, value: payloadValue }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(`analyze failed (${res.status}) ${t.slice(0, 160)}`);
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
              } else if (msg.type === "phase") {
                setPhase({ id: msg.id, label: msg.label, pct: msg.pct, elapsed: msg.elapsed });
                setElapsedMs(msg.elapsed);
              } else if (msg.type === "tick") {
                setElapsedMs(msg.elapsed);
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

  return { analyze, cancel, lines, live, tokens, profile, screenshot, source, error, phase, elapsedMs };
}
