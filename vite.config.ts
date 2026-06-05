// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    optimizeDeps: {
      include: ["@supabase/supabase-js"],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // When building on Vercel (VERCEL=1 is auto-injected), force-enable nitro
  // with the Vercel preset so the output goes to `.vercel/output/` (Build Output
  // API v3, auto-detected — no vercel.json needed). Locally and on Lovable
  // hosting, leave nitro undefined so Lovable's default behavior takes over.
  nitro: process.env.VERCEL ? { preset: "vercel" } : undefined,
});
