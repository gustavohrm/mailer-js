import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(projectRoot, "..", "..");
const sourceRoot = resolve(projectRoot, "src");
const buildOutputDir = resolve(projectRoot, "dist");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  const publicServerPort = Number(env.PORT || "3000");

  if (!Number.isInteger(publicServerPort) || publicServerPort <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  const apiProxyConfig = {
    changeOrigin: true,
    target: "http://127.0.0.1:3001",
  };

  return {
    appType: "spa",
    build: {
      emptyOutDir: true,
      outDir: buildOutputDir,
    },
    envDir: repoRoot,
    plugins: [tailwindcss()],
    publicDir: resolve(sourceRoot, "_public"),
    root: sourceRoot,
    preview: {
      host: "127.0.0.1",
      port: publicServerPort,
      proxy: {
        "/api": apiProxyConfig,
      },
      strictPort: true,
    },
    server: {
      host: "127.0.0.1",
      port: publicServerPort,
      proxy: {
        "/api": apiProxyConfig,
      },
      strictPort: true,
    },
  };
});
