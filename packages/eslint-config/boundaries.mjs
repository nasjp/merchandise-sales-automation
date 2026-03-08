export const boundariesConfig = [
  {
    files: ["packages/domain/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@merchandise/db",
                "@merchandise/db/*",
                "@merchandise/llm",
                "@merchandise/llm/*",
                "@merchandise/shared",
                "@merchandise/shared/*",
                "@merchandise/common",
                "@merchandise/common/*",
                "@merchandise/utils",
                "@merchandise/utils/*",
                "drizzle-orm",
                "drizzle-orm/*",
                "postgres",
                "next",
                "next/*",
              ],
              message:
                "packages/domain は pure function 層です。DB/LLM/Next 依存を持たないでください。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}", "apps/jobs/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/packages/*/src/**",
                "../../packages/*/src/**",
                "../../../packages/*/src/**",
                "../../../../packages/*/src/**",
                "@merchandise/shared",
                "@merchandise/shared/*",
                "@merchandise/common",
                "@merchandise/common/*",
                "@merchandise/utils",
                "@merchandise/utils/*",
              ],
              message:
                "apps から packages の src へ相対 import しないでください。@merchandise/* 経由で import してください。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/ui/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*", "@/app/*", "**/features/*"],
              message:
                "packages/ui は primitive 専用です。feature component 依存を入れないでください。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["packages/ui/src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message: "packages/ui に feature component は配置しないでください。",
        },
      ],
    },
  },
];
