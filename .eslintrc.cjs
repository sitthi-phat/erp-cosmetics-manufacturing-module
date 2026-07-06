/**
 * ADR-008 rev.2: antd may only be imported from inside src/frontend/ui/ (the wrapper layer).
 * Anywhere else in the frontend, importing antd directly is a lint error - this keeps the
 * "surface area" of the antd dependency limited to one folder so swapping UI libraries later
 * is a wrapper rewrite, not a codebase rewrite.
 */
module.exports = {
  root: true,
  env: { node: true, es2022: true, browser: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 2022, sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  ignorePatterns: ['dist', 'node_modules', 'src/frontend/dist', '*.js', '*.cjs'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
  },
  overrides: [
    {
      files: ['src/frontend/**/*.{ts,tsx}'],
      excludedFiles: ['src/frontend/ui/**/*.{ts,tsx}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              { group: ['antd', 'antd/*', '@ant-design/*'], message: 'Import UI primitives from src/frontend/ui/ only (ADR-008 rev.2 wrapper layer). Do not import antd directly here.' }
            ]
          }
        ]
      }
    }
  ]
};
