// eslint.types.config.mjs
// @ts-check
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";

export default tseslint.config(
  {
    ignores: [
      "**/*.mjs",
      "**/*.js",
      "backend/test/**",
      "**/*.spec.ts",
      "**/__tests__/**",
    ],
  },
  ...tseslint.configs.recommendedTypeChecked,

  {
    plugins: { import: importPlugin },
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        project: ["./tsconfig.eslint.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Tighten TS safety
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: { attributes: false } },
      ],
      "@typescript-eslint/no-unsafe-assignment": "warn",
      "@typescript-eslint/no-unsafe-argument": "warn",
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-unsafe-call": "warn",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "@typescript-eslint/restrict-template-expressions": [
        "warn",
        { allow: ["string", "number", "boolean"] },
      ],
      "@typescript-eslint/require-await": "error",

      // Imports: cycles & deps
      "import/no-cycle": ["error", { maxDepth: 3 }],
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: [
            "**/*.test.ts",
            "**/*.spec.ts",
            "**/test/**",
            "**/scripts/**",
          ],
          optionalDependencies: false,
          peerDependencies: false,
        },
      ],
      "import/no-unresolved": "off",
    },
  },
);
