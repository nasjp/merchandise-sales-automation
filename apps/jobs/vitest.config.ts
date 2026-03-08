import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@merchandise/db/test": resolve(__dirname, "../../packages/db/src/test.ts"),
      "@merchandise/db/schema": resolve(
        __dirname,
        "../../packages/db/src/schema/index.ts",
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
    },
  },
});
