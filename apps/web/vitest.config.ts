import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      "@merchandise/db/test": resolve(__dirname, "../../packages/db/src/test.ts"),
      "@merchandise/db/schema": resolve(
        __dirname,
        "../../packages/db/src/schema/index.ts",
      ),
      "@merchandise/contracts": resolve(
        __dirname,
        "../../packages/contracts/src/index.ts",
      ),
      "@merchandise/db": resolve(__dirname, "../../packages/db/src/index.ts"),
      "@merchandise/domain": resolve(
        __dirname,
        "../../packages/domain/src/index.ts",
      ),
      "@merchandise/llm": resolve(__dirname, "../../packages/llm/src/index.ts"),
      "@merchandise/mercari": resolve(
        __dirname,
        "../../packages/mercari/src/index.ts",
      ),
      "@merchandise/ui": resolve(__dirname, "../../packages/ui/src/index.ts"),
    },
  },
});
