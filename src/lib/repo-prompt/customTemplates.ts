import { useEffect, useState, useCallback } from "react";
import { TEMPLATES, type TemplateId } from "./templates";

export type CustomTemplate = {
  id: string; // "var_<uuid>"
  name: string;
  basedOn?: TemplateId; // built-in id this variant started from
  prompt: string;
  updatedAt: number;
};

const KEY = "repoPrompt.customTemplates.v1";
const EVT = "repoPrompt:customTemplates";

function read(): CustomTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CustomTemplate[]) : [];
  } catch {
    return [];
  }
}

function write(list: CustomTemplate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVT));
}

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `var_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `var_${Math.random().toString(36).slice(2, 10)}`;
}

export function useCustomTemplates() {
  const [list, setList] = useState<CustomTemplate[]>(() => read());

  useEffect(() => {
    const refresh = () => setList(read());
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const upsert = useCallback((tpl: Omit<CustomTemplate, "id" | "updatedAt"> & { id?: string }) => {
    const now = Date.now();
    const current = read();
    let saved: CustomTemplate;
    if (tpl.id) {
      saved = { id: tpl.id, name: tpl.name, basedOn: tpl.basedOn, prompt: tpl.prompt, updatedAt: now };
      const next = current.map((v) => (v.id === tpl.id ? saved : v));
      if (!current.find((v) => v.id === tpl.id)) next.push(saved);
      write(next);
    } else {
      saved = { id: uid(), name: tpl.name, basedOn: tpl.basedOn, prompt: tpl.prompt, updatedAt: now };
      write([...current, saved]);
    }
    return saved;
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((v) => v.id !== id));
  }, []);

  return { variants: list, upsertVariant: upsert, removeVariant: remove };
}

export function resolveVariantPrompt(id: string): CustomTemplate | undefined {
  return read().find((v) => v.id === id);
}

export function basePromptFor(basedOn?: TemplateId): string {
  if (!basedOn) return "";
  return TEMPLATES.find((t) => t.id === basedOn)?.prompt ?? "";
}
