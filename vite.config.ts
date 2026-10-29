// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const punycodePath = require.resolve("punycode/");

// Plugin: intercept `require("punycode/")` before unenv's Node built-in mapping
// (used by mongodb's tr46 dependency) turns it into a broken directory shim.
const punycodePlugin = {
  name: "punycode-real-resolver",
  enforce: "pre" as const,
  resolveId(source: string) {
    if (source === "punycode" || source === "punycode/") {
      return punycodePath;
    }
    return null;
  },
};

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    plugins: [punycodePlugin],
  },
});