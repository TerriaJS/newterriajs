"use strict";

module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    // https://github.com/typescript-eslint/typescript-eslint/blob/v6/packages/eslint-plugin/src/configs/recommended.ts
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2019,
    ecmaFeatures: {
      jsx: true,
      modules: true,
      legacyDecorators: true
    }
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true
  },
  ignorePatterns: ["*.scss.d.ts", "/lib/ThirdParty"],
  plugins: ["react", "react-hooks", "@typescript-eslint"],
  globals: {
    process: true
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  rules: {
    // TODO: re-enable the disabled @typescript-eslint rules.
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-this-alias": "off",
    "@typescript-eslint/no-empty-object-type": [
      "error",
      { allowInterfaces: "with-single-extends" }
    ],
    "@typescript-eslint/unified-signatures": "error",
    "react-hooks/exhaustive-deps": "error",
    "react/jsx-boolean-value": ["error", "never", { always: [] }],
    "react/no-arrow-function-lifecycle": "error",
    "react/no-invalid-html-attribute": "error",
    "react/jsx-no-useless-fragment": "error",
    "react/jsx-no-constructed-context-values": "error",
    "react/jsx-fragments": ["error", "syntax"],
    "react/jsx-no-duplicate-props": ["error", { ignoreCase: true }],
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
    "react/self-closing-comp": "error",
    "react/jsx-no-undef": ["error", { allowGlobals: true }],

    /* Ignore styled-components css property */
    "react/no-unknown-property": ["error", { ignore: ["css"] }],

    /*Possible Errors */
    "no-console": "off",
    "no-inner-declarations": [1, "functions"],

    /* Best Practices */
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

    /* Strict Mode */
    strict: [0, "global"],

    /* Variables */
    "no-label-var": 1,
    "@typescript-eslint/no-unused-vars": [
      "warn",
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
    "no-new-object": 1,
    "no-unneeded-ternary": 1 /* ECMAScript 6 */,
    "prefer-const": "error"
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        /* The no-useless-constructor needs to be disabled for
            the @typescript-eslint-rule. */
        "no-useless-constructor": "off",
        "@typescript-eslint/no-useless-constructor": "error",
        // @TODO: revise these rules
        "@typescript-eslint/consistent-type-assertions": "error",
        "react-hooks/exhaustive-deps": "error",
        // FIXME: typescript-eslint 8 gave 1400+ react/prop-types warnings.
        "react/prop-types": "off"
      }
    }
  ]
};
