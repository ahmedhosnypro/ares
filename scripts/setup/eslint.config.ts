import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import cspellESLintPluginRecommended from "@cspell/eslint-plugin/recommended";
import globals from "globals";

// eslint-disable-next-line @typescript-eslint/no-deprecated
export default tseslint.config(
  // Global ignores
  {
    ignores: ["node_modules/**", "dist/**", "build/**", ".bun/**", "*.log", "bun.lockb"],
  },

  // Base configs
  eslint.configs.recommended,
  cspellESLintPluginRecommended,

  // TypeScript configuration
  {
    files: ["**/*.ts"],
    extends: [...tseslint.configs.strictTypeChecked],
    languageOptions: {
      ecmaVersion: 2023,
      globals: {
        ...globals.node,
        ...globals.es2023,
      },
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-explicit-any": "error",

      // Allow console in CLI tools
      "no-console": "off",

      // Spell checking
      "@cspell/spellchecker": [
        "warn",
        {
          autoFix: true,
          configFile: new URL("./cspell.config.yaml", import.meta.url).toString(),
          cspellOptionsRoot: import.meta.url,
        },
      ],
    },
  }
);
