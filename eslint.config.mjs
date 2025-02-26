// @ts-check

"use strict";

import globals from "globals";
import { fixupPluginRules } from "@eslint/compat";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import eslintConfigPrettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.Config[]} */
export default tseslint.config(
  eslint.configs.recommended,
  // https://github.com/typescript-eslint/typescript-eslint/blob/v8.18.1/packages/eslint-plugin/src/configs/recommended.ts
  ...tseslint.configs.recommended,
  {
    name: "Globals for buildprocess/",
    // !!! WARNING !!!: do NOT put a space after "," inside {} in globs. Doing
    //                  so will make ESLint produce errors for disabled rules
    //                  because it has "forgotten" half of its config.
    files: ["buildprocess/**/*.{js,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    name: "Globals for ./ and lib/",
    files: ["{,lib/**/}*.{js,ts,jsx,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        process: true
      }
    }
  },
  {
    name: "Globals for test/",
    files: ["test/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jasmine
      }
    }
  },
  {
    name: "Shared config for everything/",
    files: ["{buildprocess,lib}/**/*.{js,ts,jsx,tsx}", "test/**/*.{ts,tsx}"],
    extends: [
      pluginReact.configs.flat.recommended
      // TODO: Enable next line when upgrading to React 17+.
      // pluginReact.configs.flat['jsx-runtime'],
    ],
    plugins: {
      "react-hooks": fixupPluginRules(pluginReactHooks)
    },
    languageOptions: {
      // The React plugin's recommended config does not contain language options.
      ...pluginReact.configs.flat.recommended.languageOptions,
      ecmaVersion: 2019,
      sourceType: "script",

      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          legacyDecorators: true
        }
      }
    },
    settings: {
      react: {
        version: "detect"
      }
    },
    rules: {
      // TODO: re-enable the disabled @typescript-eslint rules.
      "@typescript-eslint/no-explicit-any": ["off", { ignoreRestArgs: true }],
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-this-alias": "off",

      "@typescript-eslint/no-empty-object-type": [
        "error",
        {
          allowInterfaces: "with-single-extends"
        }
      ],
      // The no-useless-constructor needs to be disabled for
      // the @typescript-eslint-rule.
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "error",
      "@typescript-eslint/unified-signatures": "error",
      "@typescript-eslint/consistent-type-assertions": "error",
      "react-hooks/exhaustive-deps": "error",

      "react/jsx-boolean-value": [
        "error",
        "never",
        {
          always: []
        }
      ],

      "react/no-arrow-function-lifecycle": "error",
      "react/no-invalid-html-attribute": "error",
      "react/jsx-no-useless-fragment": "error",
      "react/jsx-no-constructed-context-values": "error",
      "react/jsx-fragments": ["error", "syntax"],

      "react/jsx-no-duplicate-props": [
        "error",
        {
          ignoreCase: true
        }
      ],

      "react/jsx-pascal-case": [
        "error",
        {
          allowAllCaps: true,
          ignore: []
        }
      ],

      "react/no-danger": "warn",
      "react/no-did-update-set-state": "error",
      "react/no-will-update-set-state": "error",
      "react/prop-types": "error",
      "react/self-closing-comp": "error",

      "react/jsx-no-undef": [
        "error",
        {
          allowGlobals: true
        }
      ],

      // Possible Errors.
      "no-console": "off",
      "no-inner-declarations": [1, "functions"],
      // Best Practices.
      eqeqeq: ["error"],
      "no-alert": ["error"],
      "no-caller": ["error"],
      "no-div-regex": ["error"],
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-eval": ["error"],
      "no-extend-native": ["error"],
      "no-fallthrough": 0,
      "no-implied-eval": ["error"],
      "no-iterator": ["error"],
      "no-labels": ["error"],
      "no-lone-blocks": ["error"],
      "no-loop-func": ["error"],
      "no-new-func": ["error"],
      "no-new-wrappers": ["error"],
      "no-new": ["error"],
      "no-octal-escape": ["error"],
      "no-proto": ["error"],
      "no-return-assign": ["error"],
      "no-script-url": ["error"],
      "no-sequences": ["error"],
      radix: "error",

      // Strict Mode.
      strict: [0, "global"],

      // Variables.
      "no-label-var": 1,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true
        }
      ],
      camelcase: [
        0,
        {
          properties: "always"
        }
      ],

      "no-array-constructor": "error",
      "no-unneeded-ternary": 1,
      // See:
      // https://stackoverflow.com/questions/64646248/eslintrc-js-for-react-17-and-jsx-without-import-react/64646593#64646593
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        {
          ignore: ["css"]
        }
      ]
    }
  },
  {
    name: "Disable type checked rules for JavaScript",
    files: ["{,buildprocess/**/,lib/**/}*.{js,jsx}"],
    extends: [tseslint.configs.disableTypeChecked]
  },
  {
    name: "Globally ignored files",
    ignores: [
      "{dist,ts-out,lib/ThirdParty}/**",
      "wwwroot/{build,third_party}/**",
      "**/*.scss.d.ts",
      "test/**/*.{js,jsx}"
    ]
  },
  eslintConfigPrettier
);
