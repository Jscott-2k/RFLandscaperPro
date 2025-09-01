// eslint.config.mjs
// @ts-check
import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import perfectionist from "eslint-plugin-perfectionist";
import promisePlugin from "eslint-plugin-promise";
import sonarjs from "eslint-plugin-sonarjs";
import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

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
      "**/karma.conf.js",
      "**/.angular/**",
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
      globals: { ...globals.node, ...globals.jest },
      sourceType: "commonjs",
    },
  },

  // Enable plugins + rules (fast profile)
  {
    plugins: {
      import: importPlugin,
      perfectionist,
      promise: promisePlugin,
      sonarjs,
      unicorn,
      "unused-imports": unusedImports,
    },
    rules: {
      // TypeScript (non-type-checked)
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { fixStyle: "inline-type-imports", prefer: "type-imports" },
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
      "@typescript-eslint/no-unused-vars": "off", // handled by unused-imports
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/switch-exhaustiveness-check": "off",

      curly: ["error", "all"],
      eqeqeq: ["error", "smart"],
      // Imports
      "import/first": "error",
      "import/newline-after-import": ["error", { count: 1 }],
      "import/no-duplicates": ["error", { considerQueryString: true }],

      "import/no-mutable-exports": "error",
      "import/no-unresolved": "off", // TS resolver; off in fast config

      // General JS
      "no-console": "off",
      "no-implicit-coercion": "warn",
      "no-param-reassign": ["warn", { props: true }],
      "no-return-assign": "error",
      "no-useless-return": "error",

      // Sorting / consistency
      "perfectionist/sort-imports": [
        "error",
        {
          groups: [
            "type",
            ["builtin", "external"],
            ["internal", "parent", "sibling", "index"],
            "side-effect",
            "object",
            "unknown",
          ],
          newlinesBetween: "always",
          type: "natural",
        },
      ],
      "perfectionist/sort-interfaces": [
        "warn",
        { order: "asc", type: "natural" },
      ],
      "perfectionist/sort-objects": ["warn", { order: "asc", type: "natural" }],

      "prefer-const": ["error", { destructuring: "all" }],
      "promise/no-multiple-resolved": "warn",
      "promise/no-nesting": "warn",
      "promise/no-new-statics": "error",
      // Promises
      "promise/no-return-wrap": "error",

      "promise/param-names": "error",
      "sonarjs/cognitive-complexity": ["warn", 20],
      // SonarJS
      "sonarjs/no-all-duplicated-branches": "warn",

      "sonarjs/no-identical-functions": "warn",
      "unicorn/no-array-push-push": "warn",
      "unicorn/no-null": "off",
      // Unicorn
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-structured-clone": "warn",
      "unicorn/prefer-top-level-await": "off",
      // Unused imports/vars — auto-fix
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          args: "after-used",
          argsIgnorePattern: "^_",
          vars: "all",
          varsIgnorePattern: "^_",
        },
      ],
      yoda: ["error", "never"],
    },
  },

  // TS-only add-ons
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/require-await": "off",
    },
  },

  // Scripts (mjs)
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { sourceType: "module" },
  },
);
