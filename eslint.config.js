import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
    { ignores: ['dist', 'node_modules', 'coverage', 'playwright-report', 'test-results'] },
    {
        files: ['src/**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            parserOptions: { ecmaFeatures: { jsx: true } },
            globals: { ...globals.browser, ...globals.node },
        },
        plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
        rules: {
            ...js.configs.recommended.rules,
            // Classic hooks-correctness rules only — eslint-plugin-react-hooks v7's
            // `recommended-latest` bundle adds a large set of React Compiler-era rules
            // (immutability, static-components, refs, ...) aimed at compiler-optimizable
            // code. This app targets React 18 without the compiler, so that bundle would
            // flag a lot of patterns that aren't actually bugs here — out of scope for
            // this pass.
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
            // Pragmatic for a UI-heavy codebase with lots of intentionally-unused
            // destructured props/catch bindings; not a signal worth failing lint on.
            'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_', caughtErrors: 'none' }],
            // `catch {}` (silently-swallowed, non-critical storage/fetch errors) is an
            // established idiom throughout this codebase — not a bug to flag here.
            'no-empty': ['error', { allowEmptyCatch: true }],
        },
    },
    {
        files: ['src/**/__tests__/**/*.{js,jsx}', 'src/test/**/*.js'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node, ...globals.vitest },
        },
    },
    {
        files: ['e2e/**/*.js', '*.config.js'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: globals.node,
        },
        rules: js.configs.recommended.rules,
    },
];
