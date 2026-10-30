import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const punycodePath = require.resolve("punycode/");

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

const isVercel = process.env.DEPLOY_TARGET === "vercel" || process.env.VERCEL === "1";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
    // Enable SPA mode for Cloudflare to prevent Error 1102, keep SSR for Vercel
    spa: {
      enabled: !isVercel,
    },
  },
  nitro: {
    preset: isVercel ? "vercel" : "cloudflare-pages",
  },
  vite: {
    plugins: [punycodePlugin],
  },
});