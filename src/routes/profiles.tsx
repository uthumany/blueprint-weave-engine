import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, FolderOpen, FileJson, Trash2, X, Download, Merge, GitCompare } from "lucide-react";
import { Icon3d } from "@/components/Icon3d";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ProfilePreview } from "@/components/ProfilePreview";
import { loadProfiles, deleteProfile, renameProfile, duplicateProfile, saveProfile, type SavedProfile } from "@/lib/profileStore";
import { diffProfiles, hybridizeProfiles, summarizeProfile } from "@/lib/profileUtils";
import { toast } from "sonner";

export const Route = createFileRoute("/profiles")({
  head: () => ({
    meta: [
      { title: "Profiles — NOTEPADIFY" },
      { name: "description", content: "Browse and manage your saved .dna.json design profiles." },
      { property: "og:title", content: "Profiles — NOTEPADIFY" },
      { property: "og:description", content: "Saved visual DNA extractions ready to compose with." },
    ],
  }),
  component: ProfilesPage,
});

function ProfilesPage() {
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const navigate = useNavigate();

  const refresh = () => setProfiles(loadProfiles());

  useEffect(() => { refresh(); }, []);

  const selectedProfile = profiles.find((p) => p.id === selected);
  const comparisonProfile = compareId ? profiles.find((p) => p.id === compareId) : null;

  const doDelete = (id: string, label: string) => {
    const next = deleteProfile(id);
    setProfiles(next);
    if (selected === id) setSelected(null);
    if (compareId === id) setCompareId(null);
    toast.success(`Deleted · ${label}`);
  };

  const doDuplicate = (id: string) => {
    const next = duplicateProfile(id);
    setProfiles(next);
    toast.success("Duplicated");
  };

  const doRename = (id: string) => {
    if (renameVal.trim()) {
      const next = renameProfile(id, renameVal.trim());
      setProfiles(next);
      setRenaming(null);
      toast.success("Renamed");
    }
  };

  const doDownload = (p: SavedProfile) => {
    const blob = new Blob([JSON.stringify(p.profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${p.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 48)}.dna.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  const doShare = (p: SavedProfile) => {
    const text = summarizeProfile(p);
    navigator.clipboard?.writeText(text).then(
      () => toast.success("Share summary copied to clipboard"),
      () => toast.error("Could not copy"),
    );
  };

  const doGenerate = (p: SavedProfile) => {
    navigate({ to: "/generate", search: { profile: JSON.stringify(p.profile) } as any });
  };

  const diff = selectedProfile && comparisonProfile
    ? diffProfiles(selectedProfile.profile, comparisonProfile.profile)
    : null;

  const doHybridize = () => {
    if (!selectedProfile || !comparisonProfile) return;
    const hybrid = hybridizeProfiles(selectedProfile.profile, comparisonProfile.profile);
    const saved: SavedProfile = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      label: `${selectedProfile.label} + ${comparisonProfile.label}`,
      kind: "url",
      analyzedAt: new Date().toISOString(),
      profile: hybrid,
    };
    saveProfile(saved);
    setProfiles(loadProfiles());
    toast.success("Hybrid profile created!");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-mesh pointer-events-none" />
      <div className="absolute inset-0 bg-grid pointer-events-none [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <SiteHeader />

      <section className="relative container-page pt-12 sm:pt-16 pb-24">
        <Link to="/" className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-lime transition-colors">
          <ArrowLeft className="size-3" /> back
        </Link>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime mt-8">› the library</p>
        <h1 className="font-display text-[clamp(2.5rem,6vw,5rem)] leading-[0.95] tracking-tight mt-3">
          Your <em className="text-lime not-italic">profile</em> library.
        </h1>
        <p className="mt-5 max-w-xl text-muted-foreground leading-relaxed">
          Saved <span className="font-mono text-foreground">.dna.json</span> profiles live here — diff, hybridize, and ship them.
        </p>

        {/* Profile grid */}
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/"
            className="group rounded-2xl glass p-5 hover:border-lime/30 hover:-translate-y-0.5 transition-all flex flex-col items-start min-h-[180px] justify-between"
          >
            <div className="size-10 rounded-lg bg-lime/15 grid place-items-center">
              <Icon3d name="Plus" size={22} className="text-lime" />
            </div>
            <div>
              <h3 className="font-display text-2xl">New profile</h3>
              <p className="font-mono text-[11px] text-muted-foreground mt-1">analyze a website →</p>
            </div>
          </Link>

          {profiles.length === 0 ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl glass p-5 min-h-[180px] flex flex-col justify-between opacity-60">
                  <FolderOpen className="size-5 text-muted-foreground" />
                  <div>
                    <h3 className="font-display text-2xl">empty.slot</h3>
                    <p className="font-mono text-[11px] text-muted-foreground mt-1">no profile saved</p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            profiles.map((p) => {
              const prof = p.profile;
              const isSelected = selected === p.id;
              const swatches = prof.palette.slice(0, 5);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(isSelected ? null : p.id)}
                  className={`rounded-2xl glass p-5 min-h-[180px] flex flex-col justify-between text-left transition-all ${
                    isSelected ? "border-lime/50 ring-1 ring-lime/30" : "hover:border-lime/20 hover:-translate-y-0.5"
                  }`}
                >
                  {/* Color swatch bar */}
                  <div className="flex gap-1 mb-3">
                    {swatches.map((s) => (
                      <div
                        key={s.name}
                        className="h-5 flex-1 rounded-sm first:rounded-l-md last:rounded-r-md border border-white/10"
                        style={{ background: s.hex }}
                        title={`${s.name}: ${s.hex}`}
                      />
                    ))}
                  </div>

                  <div>
                    {renaming === p.id ? (
                      <form
                        onSubmit={(e) => { e.preventDefault(); doRename(p.id); }}
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          autoFocus
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          className="flex-1 bg-surface border border-border rounded px-2 py-1 font-display text-lg text-foreground outline-none"
                        />
                        <button type="submit" className="size-7 rounded-md bg-lime/20 grid place-items-center text-lime hover:bg-lime/30">
                          <Icon3d name="Check" size={15} />
                        </button>
                        <button type="button" onClick={() => setRenaming(null)} className="size-7 rounded-md bg-surface border border-border grid place-items-center text-muted-foreground hover:text-foreground">
                          <X className="size-3.5" />
                        </button>
                      </form>
                    ) : (
                      <h3 className="font-display text-2xl truncate">{p.label}</h3>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {prof.mood.slice(0, 3).map((m) => (
                        <span key={m} className="font-mono text-[9px] px-1.5 py-0.5 rounded-md bg-surface border border-border text-muted-foreground">
                          {m}
                        </span>
                      ))}
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-md bg-lime/10 text-lime border border-lime/20">
                        {Math.round(prof.confidence * 100)}%
                      </span>
                    </div>

                    <p className="font-mono text-[10px] text-muted-foreground mt-2">
                      {prof.typography.display} · {new Date(p.analyzedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions — visible when selected */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => { setRenaming(p.id); setRenameVal(p.label); }}
                        className="inline-flex items-center gap-1 px-2 h-7 rounded-md bg-surface border border-border font-mono text-[10px] text-muted-foreground hover:text-foreground">
                        <Icon3d name="Pencil" size={14} /> rename
                      </button>
                      <button type="button" onClick={() => doDuplicate(p.id)}
                        className="inline-flex items-center gap-1 px-2 h-7 rounded-md bg-surface border border-border font-mono text-[10px] text-muted-foreground hover:text-foreground">
                        <Icon3d name="Copy" size={14} /> dup
                      </button>
                      <button type="button" onClick={() => doDownload(p)}
                        className="inline-flex items-center gap-1 px-2 h-7 rounded-md bg-surface border border-border font-mono text-[10px] text-muted-foreground hover:text-foreground">
                        <Download className="size-3" /> dl
                      </button>
                      <button type="button" onClick={() => doShare(p)}
                        className="inline-flex items-center gap-1 px-2 h-7 rounded-md bg-surface border border-border font-mono text-[10px] text-muted-foreground hover:text-foreground">
                        <FileJson className="size-3" /> share
                      </button>
                      <button type="button" onClick={() => doGenerate(p)}
                        className="inline-flex items-center gap-1 px-2 h-7 rounded-md bg-lime/20 text-lime border border-lime/30 font-mono text-[10px] hover:bg-lime/30">
                        <FileJson className="size-3" /> generate
                      </button>
                      <button type="button" onClick={() => doDelete(p.id, p.label)}
                        className="inline-flex items-center gap-1 px-2 h-7 rounded-md bg-magenta/10 text-magenta border border-magenta/30 font-mono text-[10px] hover:bg-magenta/20">
                        <Trash2 className="size-3" /> delete
                      </button>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Diff / Hybridize panel */}
        {selectedProfile && (
          <div className="mt-8 rounded-2xl glass p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-lime">
                › selected · {selectedProfile.label}
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={compareId ?? ""}
                  onChange={(e) => setCompareId(e.target.value || null)}
                  className="bg-surface border border-border rounded-lg px-3 py-1.5 font-mono text-[11px] text-foreground outline-none"
                >
                  <option value="">Compare / hybridize with…</option>
                  {profiles.filter((p) => p.id !== selected).map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>

                {comparisonProfile && (
                  <>
                    <button
                      type="button"
                      onClick={doHybridize}
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-lime/20 text-lime border border-lime/30 font-mono text-[11px] hover:bg-lime/30"
                    >
                      <Merge className="size-3.5" /> Hybridize
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompareId(null)}
                      className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg bg-surface border border-border font-mono text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" /> clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Selected profile preview */}
            <div className="mt-4">
              <ProfilePreview profile={selectedProfile.profile} source={selectedProfile.label} />
            </div>

            {/* Diff output */}
            {diff && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <GitCompare className="size-4 text-lime" />
                  <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Diff · {selectedProfile.label} vs {comparisonProfile?.label}
                  </span>
                </div>

                {/* Palette diff */}
                <div className="rounded-xl border border-border bg-surface/40 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Color System</p>
                  <div className="space-y-2">
                    {diff.palette.map((c) => (
                      <div key={c.name} className="flex items-center gap-3 font-mono text-xs">
                        <span className="w-20 text-muted-foreground">{c.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded ${c.same ? "" : "bg-magenta/10 text-magenta"}`}>{c.a}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className={`px-2 py-0.5 rounded ${c.same ? "" : "bg-lime/10 text-lime"}`}>{c.b}</span>
                        </div>
                        {c.a === "—" && <span className="text-lime/60 text-[10px]">(added)</span>}
                        {c.b === "—" && <span className="text-magenta/60 text-[10px]">(removed)</span>}
                        {c.same && <span className="text-muted-foreground/40 text-[10px]">same</span>}
                        {!c.same && c.a !== "—" && c.b !== "—" && <span className="text-amber-400/60 text-[10px]">changed</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography diff */}
                <div className="rounded-xl border border-border bg-surface/40 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Typography</p>
                  <div className="space-y-1 font-mono text-xs">
                    <p>Display: <span className={diff.typography.display.same ? "text-muted-foreground" : "text-amber-400"}>{diff.typography.display.a}</span> → <span className={diff.typography.display.same ? "text-muted-foreground" : "text-lime"}>{diff.typography.display.b}</span></p>
                    <p>Body: <span className={diff.typography.body.same ? "text-muted-foreground" : "text-amber-400"}>{diff.typography.body.a}</span> → <span className={diff.typography.body.same ? "text-muted-foreground" : "text-lime"}>{diff.typography.body.b}</span></p>
                  </div>
                </div>

                {/* Mood diff */}
                <div className="rounded-xl border border-border bg-surface/40 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Mood</p>
                  <div className="flex flex-wrap gap-2">
                    {diff.mood.added.map((m) => <span key={m} className="font-mono text-[11px] px-2 py-1 rounded-md bg-lime/10 text-lime border border-lime/30">+{m}</span>)}
                    {diff.mood.removed.map((m) => <span key={m} className="font-mono text-[11px] px-2 py-1 rounded-md bg-magenta/10 text-magenta border border-magenta/30">-{m}</span>)}
                    {diff.mood.common.map((m) => <span key={m} className="font-mono text-[11px] px-2 py-1 rounded-md bg-surface border border-border text-muted-foreground">{m}</span>)}
                  </div>
                </div>

                {/* Motion & spacing */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-surface/40 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Spacing Base</p>
                    <p className="font-mono text-sm">{diff.spacing.a}px → {diff.spacing.b}px {diff.spacing.same && <span className="text-muted-foreground/40">(same)</span>}</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface/40 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Motion</p>
                    <p className="font-mono text-sm">{diff.motion.a} → {diff.motion.b}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><FileJson className="size-3 text-lime" /> {profiles.length} profile{profiles.length !== 1 ? "s" : ""} saved</span>
          <span className="inline-flex items-center gap-1.5"><FileJson className="size-3 text-lime" /> portable .dna.json</span>
        </div>
      </section>
    </div>
  );
}
