// Lint rules that encode this project's testing conventions.
// The Playwright plugin catches the patterns that cause flaky tests at review time:
// fixed waits, missing awaits, and one-off reads instead of web-first assertions.
import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'blob-report/', 'test-results/', 'demo-app/', '.claude/'] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['tests/**/*.ts', 'pages/**/*.ts', 'fixtures/**/*.ts', 'helpers/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // project rules (CLAUDE.md / docs/flaky-case.md): these are errors, not warnings
      'playwright/no-wait-for-timeout': 'error',
      'playwright/prefer-web-first-assertions': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/no-focused-test': 'error',
      'playwright/no-networkidle': 'error',
      'playwright/no-force-option': 'error',
      'playwright/no-page-pause': 'error',
      // a skip is fine when it states its reason (e.g. Linux-only visual tests)
      'playwright/no-skipped-test': ['error', { allowConditional: true }],
      // scan() in the accessibility tests wraps the expect() call
      'playwright/expect-expect': ['error', { assertFunctionNames: ['scan'] }],
    },
  },

  {
    // type-aware rule: catches actions like `locator.click()` called without await,
    // which the Playwright plugin alone does not (it only checks expect/test.step)
    files: ['**/*.ts'],
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },

  {
    rules: {
      // allow intentionally unused destructured values prefixed with "_"
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },
);
