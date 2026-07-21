// Shared, client-safe types for the rich Design DNA profile.
// Mirrors the reference design.json layout.

export type PaletteEntry = {
  hex: string;
  role: string; // "block" | "text-accent" | "button" | free-form
  count: number;
  area?: number;
  contrast?: "light" | "dark";
};

export type FontInfo = {
  family: string;
  cleanFamily: string;
  weights: string[];
  usedFor: "heading" | "body" | "mono" | string;
  fallback: string;
  realUrl?: string;
};

export type TypeDetail = {
  role: string; // Display | H1 | H2 | H3 | H4 | Body | Small | XS | Caption
  size: number;
  weight: string;
  lineHeight: string;
  letterSpacing: string;
  font: string;
};

export type SpacingEntry = { value: number; count: number; role: string };
export type RadiusEntry = { value: number; count: number; role: string };
export type ShadowEntry = { value: string; count: number; level: "deep" | "medium" | "soft" };

export type ButtonSpec = {
  bg: string;
  border: string;
  borderRadius: number;
  color: string;
  fontSize: number;
  fontWeight: string;
  paddingH: number;
  paddingV: number;
  variant: "filled" | "ghost" | "outline";
};

export type FontFace = {
  family: string;
  src: string;
  style: string;
  weight: string;
};

export type CssCustomProperty = {
  name: string;
  value: string;
  category: "color" | "typography" | "spacing" | "other";
};

export type DnaProfile = {
  url?: string;
  title?: string;
  description?: string;
  scrapedAt: string;

  colors: {
    bg: string;
    bgSecondary: string;
    text: string;
    textSecondary: string;
    primary: string;
    secondary: string;
    border: string;
    palette: PaletteEntry[];
  };

  typography: {
    headingFont: FontInfo;
    bodyFont: FontInfo;
    fontSizes: number[];
    lineHeights: number[];
    details: TypeDetail[];
  };

  spacing: { base: number; common: SpacingEntry[] };
  borderRadius: RadiusEntry[];
  shadows: ShadowEntry[];

  components: {
    primaryButton: ButtonSpec | null;
    buttons: ButtonSpec[];
    card: ButtonSpec | null;
  };

  fontFaces: FontFace[];
  cssCustomProperties: CssCustomProperty[];

  tags: string[];
  mood: string;
  heroHeadline?: string;
  heroSubtitle?: string;
  isJapanese?: boolean;

  confidence: number;
};
