import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["dist/**", "node_modules/**", "tests/e2e/**"],
    include: ["src/**/*.test.ts", "tests/integration/**/*.test.ts"],
  },
});
