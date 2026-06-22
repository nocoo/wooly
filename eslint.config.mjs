import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "@eslint-react/eslint-plugin";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importX from "eslint-plugin-import-x";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const strictRuleConfigs = tseslint.configs.strict.filter(
  (config) => !config.plugins && config.rules,
);

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
      "worker/**",
    ],
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { sourceType: "module" },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
    },
  },
  reactPlugin.configs["recommended-typescript"],
  jsxA11y.flatConfigs.recommended,
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  ...strictRuleConfigs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // New rules in eslint-plugin-react-hooks 7.x — large refactor surface,
      // tracked separately. Keep existing react-hooks rules enforced.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",

      // ---- @eslint-react ruleset suppressions ----

      // Duplicates of eslint-plugin-react-hooks rules we already run.
      "@eslint-react/hooks-extra/no-direct-set-state-in-use-effect": "off",
      "@eslint-react/set-state-in-effect": "off",
      "@eslint-react/exhaustive-deps": "off",
      "@eslint-react/web-api/no-leaked-event-listener": "off",
      "@eslint-react/web-api/no-leaked-interval": "off",
      "@eslint-react/web-api/no-leaked-timeout": "off",

      // React 19 migration hints — shadcn/ui surface still uses these patterns.
      "@eslint-react/no-forward-ref": "off",
      "@eslint-react/no-use-context": "off",
      "@eslint-react/no-context-provider": "off",

      // Performance micro-optimization hints, not blockers.
      "@eslint-react/use-state": "off",
      "@eslint-react/no-array-index-key": "off",

      // SSR initial-data caches intentionally touch Date.now() during render.
      "@eslint-react/purity": "off",

      // Test helpers spread props that may include `children`.
      "@eslint-react/jsx-no-children-prop": "off",

      // ---- import-x suppressions ----

      // False positive against the default + named export pattern used by
      // typescript-eslint and friends.
      "import-x/no-named-as-default-member": "off",
      "import-x/no-named-as-default": "off",
    },
  },
  {
    files: ["src/**/*.{test,spec}.{ts,tsx}", "src/test/**/*.{ts,tsx}", "tests/**/*.{ts,tsx}"],
    rules: {
      // Test code legitimately uses `x!.id` after `expect(x).not.toBeNull()` /
      // `expect(x).toBeDefined()` — the assertion narrows runtime but TS sees
      // the optional return type from `.find()`. Forcing optional chaining
      // here only weakens the assertion.
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.object.name=/^(describe|it|test)$/][callee.property.name='skip']",
          message: "*.skip is not allowed — every test must run.",
        },
        {
          selector:
            "CallExpression[callee.object.name=/^(describe|it|test)$/][callee.property.name='only']",
          message: "*.only is not allowed — it silently skips other tests.",
        },
      ],
    },
  },
];

export default eslintConfig;
