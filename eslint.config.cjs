// eslint.config.cjs for ESLint v9+ (CommonJS)

module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module",
      globals: {
        chrome: true,
        window: true,
        document: true,
        navigator: true,
        setTimeout: true,
        clearTimeout: true,
        setInterval: true,
        clearInterval: true
      }
    },
    rules: {
      "no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
      "no-console": "off"
    },
  ignores: ["*.json", "**/*.json"]
  },
  // JSON linting removed due to plugin/ESLint v9 incompatibility
];
