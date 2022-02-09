module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
  },
  settings: {
    node: {
      tryExtensions: [".js", ".json", ".node", ".ts", ".d.ts"],
    },
  },
  globals: {
    fetch: false,
    ethereum: false,
    jest: true,
  },
  overrides: [
    {
      files: ["*.spec.js"],

      rules: {
        "jest/valid-expect": 0,
      },
    },
  ],
  // plugins: ["@typescript-eslint", "jest"],
  extends: [
    "standard",
    "plugin:prettier/recommended",
    "plugin:node/recommended",
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    "node/no-unsupported-features/es-syntax": [
      "error",
      { ignores: ["modules"] },
    ],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "error",
  },
};
