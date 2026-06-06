/**
 * 3D rendered PNG icons hosted on a CDN.
 * Use <Icon3D name="Wand" className="size-8" /> as a drop-in replacement
 * for lucide-react icons when you want the chunky 3D look.
 */

export const ICON_3D_URLS = {
  AlignLeft:   "https://icons-3d-b3f876d6.netlify.app/alignleft_icon.png",
  Briefcase:   "https://icons-3d-b3f876d6.netlify.app/briefcase_icon.png",
  CheckCheck:  "https://icons-3d-b3f876d6.netlify.app/checkcheck_icon.png",
  Clipboard:   "https://icons-3d-b3f876d6.netlify.app/clipboard_icon.png",
  Globe:       "https://icons-3d-b3f876d6.netlify.app/globe_icon.png",
  Heading1:    "https://icons-3d-b3f876d6.netlify.app/heading1_icon.png",
  ImagePlus:   "https://icons-3d-b3f876d6.netlify.app/imageplus_icon.png",
  MinusCircle: "https://icons-3d-b3f876d6.netlify.app/minuscircle_icon.png",
  Navigation:  "https://icons-3d-b3f876d6.netlify.app/navigation_icon.png",
  PenLine:     "https://icons-3d-b3f876d6.netlify.app/penline_icon.png",
  PlusCircle:  "https://icons-3d-b3f876d6.netlify.app/pluscircle_icon.png",
  Quote:       "https://icons-3d-b3f876d6.netlify.app/quote_icon.png",
  Star:        "https://icons-3d-b3f876d6.netlify.app/star_icon.png",
  User:        "https://icons-3d-b3f876d6.netlify.app/user_icon.png",
  Wand:        "https://icons-3d-b3f876d6.netlify.app/wand_icon.png",
} as const;

export type Icon3DName = keyof typeof ICON_3D_URLS;

type Props = {
  name: Icon3DName;
  className?: string;
  alt?: string;
  loading?: "lazy" | "eager";
};

export function Icon3D({ name, className, alt, loading = "lazy" }: Props) {
  return (
    <img
      src={ICON_3D_URLS[name]}
      alt={alt ?? name}
      loading={loading}
      draggable={false}
      className={className}
      style={{ objectFit: "contain", userSelect: "none" }}
    />
  );
}
