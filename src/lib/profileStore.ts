import type { DnaProfile } from "./useAnalyze";

export type SavedProfile = {
  id: string;
  label: string;       // URL or filename that was analyzed
  kind: "url" | "screenshot" | "image-url";
  analyzedAt: string;  // ISO string
  profile: DnaProfile;
  screenshot?: string; // data URL or public shot URL
  tags?: string[];
};

const STORAGE_KEY = "notepadify_profiles";

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function loadProfiles(): SavedProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedProfile[];
  } catch {
    return [];
  }
}

export function saveProfile(sp: SavedProfile): SavedProfile[] {
  const all = loadProfiles();
  all.unshift(sp);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all;
}

export function deleteProfile(id: string): SavedProfile[] {
  const all = loadProfiles().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all;
}

export function renameProfile(id: string, newLabel: string): SavedProfile[] {
  const all = loadProfiles();
  const found = all.find((p) => p.id === id);
  if (found) {
    found.label = newLabel;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
  return all;
}

export function duplicateProfile(id: string): SavedProfile[] {
  const all = loadProfiles();
  const found = all.find((p) => p.id === id);
  if (found) {
    const copy: SavedProfile = {
      ...found,
      id: genId(),
      label: found.label + " (copy)",
      analyzedAt: new Date().toISOString(),
    };
    all.unshift(copy);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
  return all;
}
