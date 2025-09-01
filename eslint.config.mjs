// eslint.config.mjs
// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

import importPlugin from "eslint-plugin-import";
import promisePlugin from "eslint-plugin-promise";
import unusedImports from "eslint-plugin-unused-imports";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import perfectionist from "eslint-plugin-perfectionist";

export default tseslint.config(
  // Global ignores (monorepo-friendly)
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.cache/**",
      "**/.turbo/**",
      "**/*.gen.ts",
      "**/*.d.ts",
      // monorepo extras:
      "shared/dist/**",
      "**/shared/dist/**",
      "eslint.types.config.mjs",
    ],
  },

  // Base JS + fast TS presets
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Global language options
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",
      globals: { ...globals.node, ...globals.jest },
    },
  },

  // Enable plugins + rules (fast profile)
  {
    plugins: {
      import: importPlugin,
      promise: promisePlugin,
      "unused-imports": unusedImports,
      sonarjs,
      unicorn,
      perfectionist,
    },
    rules: {
      // TypeScript (non-type-checked)
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        { allowExpressions: true, allowHigherOrderFunctions: true },
      ],
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-empty-function": [
        "warn",
        { allow: ["private-constructors"] },
      ],
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/switch-exhaustiveness-check": "off",
      "@typescript-eslint/no-unused-vars": "off", // handled by unused-imports

      // Imports
      "import/first": "error",
      "import/newline-after-import": ["error", { count: 1 }],
      "import/no-duplicates": ["error", { considerQueryString: true }],
      "import/no-mutable-exports": "error",
      "import/no-unresolved": "off", // TS resolver; off in fast config

      // Unused imports/vars — auto-fix
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // Promises
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",
      "promise/no-new-statics": "error",
      "promise/no-multiple-resolved": "warn",
      "promise/no-nesting": "warn",

      // SonarJS
      "sonarjs/no-all-duplicated-branches": "warn",
      "sonarjs/no-identical-functions": "warn",
      "sonarjs/cognitive-complexity": ["warn", 20],

      // Unicorn
      "unicorn/prefer-node-protocol": "error",
      "unicorn/no-array-push-push": "warn",
      "unicorn/no-null": "off",
      "unicorn/prefer-structured-clone": "warn",
      "unicorn/prefer-top-level-await": "off",

      // Sorting / consistency
      "perfectionist/sort-imports": [
        "error",
        {
          type: "natural",
          groups: [
            "type",
            ["builtin", "external"],
            ["internal", "parent", "sibling", "index"],
            "side-effect",
            "object",
            "unknown",
          ],
          newlinesBetween: "always",
        },
      ],
      "perfectionist/sort-objects": ["warn", { type: "natural", order: "asc" }],
      "perfectionist/sort-interfaces": [
        "warn",
        { type: "natural", order: "asc" },
      ],

      // General JS
      "no-console": "off",
      "no-implicit-coercion": "warn",
      "no-param-reassign": ["warn", { props: true }],
      "no-return-assign": "error",
      "no-useless-return": "error",
      "prefer-const": ["error", { destructuring: "all" }],
      eqeqeq: ["error", "smart"],
      yoda: ["error", "never"],
      curly: ["error", "all"],
    },
  },

  // TS-only add-ons
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  // Scripts (mjs)
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { sourceType: "module" },
  },
);
