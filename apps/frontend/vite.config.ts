import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = resolve(projectRoot, "..", "..");
const sourceRoot = resolve(projectRoot, "src");
const buildOutputDir = resolve(projectRoot, "dist");

function getHtmlEntries(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      return getHtmlEntries(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, "");
  const publicServerPort = Number(env.PORT || "3000");
  const htmlEntries = getHtmlEntries(sourceRoot);

  if (!Number.isInteger(publicServerPort) || publicServerPort <= 0) {
    throw new Error("PORT must be a positive integer");
  }

  if (htmlEntries.length === 0) {
    throw new Error("At least one HTML entry file is required in the frontend src directory");
  }

  const apiProxyConfig = {
    changeOrigin: true,
    target: "http://127.0.0.1:3001",
  };

  return {
    appType: "mpa",
    build: {
      emptyOutDir: true,
      outDir: buildOutputDir,
      rollupOptions: {
        input: htmlEntries,
      },
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
