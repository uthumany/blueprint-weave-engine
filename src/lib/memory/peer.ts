// Client-only peer id helpers. Stores a stable anonymous id in localStorage.

const KEY = "honcho.anonId";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getAnonPeerId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = uuid().replace(/-/g, "").slice(0, 24);
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "ephemeral";
  }
}
