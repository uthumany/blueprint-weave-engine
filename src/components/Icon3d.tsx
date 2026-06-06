import { type LucideIcon } from "lucide-react";
import {
  Wand2, Copy, Check, Plus, Image as ImageIcon, Pencil, Minus, User,
  Globe, Star, Quote, Navigation, Briefcase, AlignLeft, Heading1,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Maps Lucide icon names → 3D PNG filenames.
 * Add new entries here as more 3D icons become available.
 */
const THREE_D_MAP: Record<string, string> = {
  Wand2: "wand",
  Copy: "clipboard",
  Check: "checkcheck",
  CheckCheck: "checkcheck",
  Plus: "pluscircle",
  PlusCircle: "pluscircle",
  ImageIcon: "imageplus",
  ImagePlus: "imageplus",
  Pencil: "penline",
  PenLine: "penline",
  Minus: "minuscircle",
  MinusCircle: "minuscircle",
  User: "user",
  Globe: "globe",
  Star: "star",
  Quote: "quote",
  Navigation: "navigation",
  Briefcase: "briefcase",
  AlignLeft: "alignleft",
  Heading1: "heading1",
};

/**
 * Can be rendered as a standalone 3D PNG or as a Lib icon
 * (surrounded by a glass pill that also shows the Lucide counterpart for fallback).
 */
type Icon3dMode = "auto" | "3d" | "lucide";

interface Icon3dProps {
  name: keyof typeof THREE_D_MAP | string;
  size?: number;
  className?: string;
  mode?: Icon3dMode;
  /** When true, wraps in a glass pill with the Lucide icon shown small below */
  lib?: boolean;
  libLabel?: string;
}

/** Lazy static map so we don't re-declare on every render. */
const FALLBACK_ICONS: Record<string, LucideIcon> = {
  Wand2, Copy, Check, Check, Plus, ImageIcon, Pencil, Minus, User,
  Globe, Star, Quote, Navigation, Briefcase, AlignLeft, Heading1,
};

/**
 * Icon3d renders a 3D PNG icon from the local `/icons/` directory
 * when a mapping exists, falling back gracefully to the Lucide equivalent.
 *
 * @example <Icon3d name="Wand2" size={20} />
 * @example <Icon3d name="Copy" size={16} className="text-lime" lib label="copy" />
 */
export function Icon3d({
  name,
  size = 18,
  className,
  mode = "auto",
  lib = false,
  libLabel,
}: Icon3dProps) {
  const pngFile = THREE_D_MAP[name];
  const has3d = !!pngFile;
  const use3d = mode === "3d" || (mode === "auto" && has3d);
  const FallbackIcon = FALLBACK_ICONS[name] as LucideIcon | undefined;

  // Inner icon content
  const icon = use3d && has3d ? (
    <img
      src={`/icons/${pngFile}.png`}
      alt={name}
      className={cn("object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]", className)}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  ) : FallbackIcon ? (
    <FallbackIcon
      size={size}
      className={cn(className)}
    />
  ) : null;

  if (!icon) return null;

  // "Lib" mode: glass pill with 3D icon + Lucide label below
  if (lib) {
    return (
      <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground", className)}>
        {icon}
        {libLabel && <span>{libLabel}</span>}
      </div>
    );
  }

  // Transparent wrapper for consistent sizing in layouts
  return (
    <span
      className={cn("inline-grid place-items-center shrink-0", className)}
      style={{ width: size + 4, height: size + 4 }}
    >
      {icon}
    </span>
  );
}

/** Shorthand: render just the 3D icon with size. */
export function icon3d(name: string, size = 18) {
  return <Icon3d name={name} size={size} />;
}
