// Pure profile → DESIGN.md renderer. Client-safe.
import type { DnaProfile } from "./schema";

function areaLabel(area?: number): string {
  if (!area) return "small";
  if (area > 60000) return "large";
  if (area > 10000) return "medium";
  return "small";
}

function td(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === "") return "—";
  return String(v);
}

export function profileToMarkdown(p: DnaProfile): string {
  const L: string[] = [];
  const domain = p.url ? p.url.replace(/^https?:\/\//, "").split("/")[0] : "the source";

  const heading = p.title || domain;
  L.push(`# Design System Inspired by ${heading}`);
  L.push("");
  if (p.url) {
    L.push(`> Auto-extracted from \`${p.url}\` on ${p.scrapedAt.slice(0, 10)}`);
    L.push("");
  }

  // 1. Visual Theme
  L.push("## 1. Visual Theme & Atmosphere");
  L.push("");
  L.push(p.mood || "Extracted visual system.");
  L.push("");
  if (p.heroHeadline) {
    L.push(
      `The hero section leads with "${p.heroHeadline}"${
        p.heroSubtitle ? ` followed by "${p.heroSubtitle}"` : ""
      }.`,
    );
    L.push("");
  }
  L.push("**Key Characteristics:**");
  L.push(`- ${p.typography.headingFont.cleanFamily} as the heading font`);
  L.push(`- ${p.typography.bodyFont.cleanFamily} as the body font for all running text`);
  L.push(`- Background \`${p.colors.bg}\` as the primary canvas`);
  L.push(`- Primary accent \`${p.colors.primary}\` used for CTAs and brand highlights`);
  L.push(`- ${p.shadows.length} shadow level(s) detected`);
  if (p.tags.length) L.push(`- Tags: ${p.tags.join(", ")}`);
  L.push("");

  // 2. Palette
  L.push("## 2. Color Palette & Roles");
  L.push("");
  L.push("### Primary");
  L.push(`- **Primary Accent** (\`${p.colors.primary}\`) · \`--color-primary\`: Brand color, CTA backgrounds, link text, interactive highlights.`);
  L.push(`- **Secondary Accent** (\`${p.colors.secondary}\`) · \`--color-secondary\`: Secondary brand, hover states, complementary highlights.`);
  L.push(`- **Background** (\`${p.colors.bg}\`) · \`--color-bg\`: Page background, primary canvas.`);
  L.push(`- **Background Secondary** (\`${p.colors.bgSecondary}\`) · \`--color-bg-secondary\`: Cards, surfaces, alternating sections.`);
  L.push("");
  L.push("### Text");
  L.push(`- **Text Primary** (\`${p.colors.text}\`) · \`--color-text\`: Headings and body text.`);
  L.push(`- **Text Secondary** (\`${p.colors.textSecondary}\`) · \`--color-text-secondary\`: Muted text, captions, placeholders.`);
  L.push("");
  L.push("### Borders & Surfaces");
  L.push(`- **Border** (\`${p.colors.border}\`) · \`--color-border\`: Dividers, outlines, input borders.`);
  L.push("");
  L.push("### Full Extracted Palette");
  L.push("");
  L.push("| # | Hex | CSS Variable | Role | Area | Contrast |");
  L.push("|---|---|---|---|---|---|");
  p.colors.palette.forEach((s, i) => {
    L.push(
      `| ${i + 1} | \`${s.hex}\` | \`--palette-${i + 1}\` | ${s.role} | ${areaLabel(s.area)} | text-${s.contrast === "light" ? "light" : "dark"} |`,
    );
  });
  L.push("");

  // 3. Typography
  L.push("## 3. Typography Rules");
  L.push("");
  L.push(`- **Heading Font:** \`${p.typography.headingFont.cleanFamily}\` (web font)`);
  L.push(`- **Body Font:** \`${p.typography.bodyFont.cleanFamily}\` (web font)`);
  L.push("");
  L.push("### Type Hierarchy");
  L.push("");
  L.push("| Role | Font | Size | Weight | Line Height | Letter Spacing |");
  L.push("|---|---|---|---|---|---|");
  p.typography.details.forEach((d) => {
    L.push(
      `| ${d.role} | ${d.font} | ${d.size}px | ${d.weight} | ${d.lineHeight} | ${d.letterSpacing} |`,
    );
  });
  L.push("");
  L.push("### Type Scale");
  L.push("");
  L.push("| Token | Size | Suggested Usage |");
  L.push("|---|---|---|");
  const tokens = ["Display", "H1", "H2", "H3", "H4", "Body L", "Body", "Small", "XS", "Caption"];
  p.typography.fontSizes.forEach((s, i) => {
    L.push(`| ${tokens[i] ?? `T${i + 1}`} | \`${s}px\` | ${i < 5 ? "headings" : "body / supporting text"} |`);
  });
  L.push("");

  // 4. Components
  L.push("## 4. Component Stylings");
  L.push("");
  const buttonCss = (name: string, b: NonNullable<DnaProfile["components"]["primaryButton"]>) => {
    L.push(`### ${name}`);
    L.push("");
    L.push("```css");
    L.push(`.${name.toLowerCase().replace(/\s+/g, "-")} {`);
    L.push(`  background: ${b.bg};`);
    L.push(`  color: ${b.color};`);
    L.push(`  border-radius: ${b.borderRadius}px;`);
    L.push(`  padding: ${b.paddingV}px ${b.paddingH}px;`);
    L.push(`  font-size: ${b.fontSize}px;`);
    L.push(`  font-weight: ${b.fontWeight};`);
    L.push(`  border: ${b.border || "none"};`);
    L.push(`  cursor: pointer;`);
    L.push(`}`);
    L.push("```");
    L.push("");
  };
  if (p.components.primaryButton) buttonCss("Primary Button", p.components.primaryButton);
  p.components.buttons.slice(0, 6).forEach((b, i) => {
    const label = b.variant === "ghost" ? `Ghost Button${i ? " " + (i + 1) : ""}` : b.variant === "outline" ? `Outline Button ${i + 1}` : `Filled Button ${i + 1}`;
    buttonCss(label, b);
  });

  // 5. Layout / Spacing
  L.push("## 5. Layout Principles");
  L.push("");
  L.push(`- **Base spacing unit:** \`${p.spacing.base}px\` — use multiples`);
  L.push("");
  L.push("### Spacing Scale (extracted from real elements)");
  L.push("");
  L.push("| Token | Value | Role |");
  L.push("|---|---|---|");
  p.spacing.common.forEach((s, i) => {
    L.push(`| spacing-${i + 1} | \`${s.value}px\` | ${s.role} |`);
  });
  L.push("");
  L.push("### Border Radius Scale");
  L.push("");
  L.push("| Token | Value | Element |");
  L.push("|---|---|---|");
  p.borderRadius.forEach((r) => {
    L.push(`| radius-${r.role} | \`${r.value}px\` | ${r.role} |`);
  });
  L.push("");

  // 6. Shadows
  L.push("## 6. Depth & Elevation");
  L.push("");
  if (p.shadows.length) {
    L.push("| Level | Shadow | Usage |");
    L.push("|---|---|---|");
    p.shadows.forEach((s) => {
      const usage = s.level === "deep" ? "Hero sections, deep layers" : s.level === "medium" ? "Cards, dropdowns" : "Subtle elevation";
      L.push(`| ${s.level[0].toUpperCase() + s.level.slice(1)} | \`${s.value.slice(0, 90)}${s.value.length > 90 ? "…" : ""}\` | ${usage} |`);
    });
  } else {
    L.push("_No shadows detected — the design relies on flat surfaces._");
  }
  L.push("");

  // 7. Do's/Don'ts
  L.push("## 7. Do's and Don'ts");
  L.push("");
  L.push("### Do");
  L.push(`- Use \`${p.colors.bg}\` as the primary background color`);
  L.push(`- Use \`${p.typography.headingFont.cleanFamily}\` for headings and \`${p.typography.bodyFont.cleanFamily}\` for body text`);
  L.push(`- Use \`${p.colors.primary}\` as the dominant accent/CTA color`);
  L.push(`- Maintain \`${p.spacing.base}px\` as the base spacing unit`);
  L.push("");
  L.push("### Don't");
  L.push("- Don't use colors outside the extracted palette without justification");
  L.push(`- Don't substitute ${p.typography.headingFont.cleanFamily} with generic alternatives`);
  L.push("- Don't invent UI patterns the source site doesn't have");
  L.push(`- Don't use pure black for text — use \`${p.colors.text}\` instead`);
  L.push("");

  // 8. Responsive
  L.push("## 8. Responsive Behavior");
  L.push("");
  L.push("| Breakpoint | Width | Notes |");
  L.push("|---|---|---|");
  L.push("| Mobile | < 640px | Single column, stack sections |");
  L.push("| Tablet | 640–1024px | 2-column where appropriate |");
  L.push("| Desktop | 1024–1440px | Full layout as designed |");
  L.push("| Wide | > 1440px | Max-width container |");
  L.push("");

  // 9. Agent Prompt Guide
  L.push("## 9. Agent Prompt Guide");
  L.push("");
  L.push("### Quick Color Reference");
  L.push("");
  L.push("```");
  L.push(`Background:  ${p.colors.bg}`);
  L.push(`Text:        ${p.colors.text}`);
  L.push(`Accent:      ${p.colors.primary}`);
  L.push(`Secondary:   ${p.colors.secondary}`);
  L.push(`Border:      ${p.colors.border}`);
  L.push("```");
  L.push("");
  L.push("### Example Prompts");
  L.push("");
  L.push(`1. "Build a hero section with a \`${p.colors.bg}\` background, \`${p.typography.headingFont.cleanFamily}\` heading in \`${p.colors.text}\`, and a \`${p.colors.primary}\` CTA button."`);
  L.push(`2. "Create a pricing card using background \`${p.colors.bgSecondary}\`, border \`${p.colors.border}\`, and ${td(p.spacing.common[0]?.value)}px padding."`);
  L.push(`3. "Design a navigation bar — \`${p.colors.bg}\` background, \`${p.colors.text}\` links, \`${p.colors.primary}\` for active state."`);
  L.push("");

  // 10. CSS Custom Properties
  L.push("## 10. CSS Custom Properties");
  L.push("");
  L.push(`> ${p.cssCustomProperties.length} custom properties extracted from \`:root\` / \`html\` stylesheets.`);
  L.push("");
  const groups: Record<string, typeof p.cssCustomProperties> = { color: [], typography: [], spacing: [], other: [] };
  p.cssCustomProperties.forEach((c) => groups[c.category].push(c));
  const groupTitle: Record<string, string> = {
    color: "Color Variables",
    typography: "Typography Variables",
    spacing: "Spacing Variables",
    other: "Other Variables",
  };
  for (const cat of ["color", "typography", "spacing", "other"] as const) {
    if (!groups[cat].length) continue;
    L.push(`### ${groupTitle[cat]}`);
    L.push("");
    L.push("| Variable | Value |");
    L.push("|---|---|");
    groups[cat].forEach((c) => L.push(`| \`${c.name}\` | \`${c.value}\` |`));
    L.push("");
  }

  return L.join("\n");
}
