import js from '@eslint/js';
import ts from 'typescript-eslint';
import astro from 'eslint-plugin-astro';

export default [
  { ignores: ['database/**', '**/dist/**', '**/.astro/**', 'packages/blog/public/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  {
    // 인라인 스크립트는 브라우저에서 돌고 rehype 플러그인은 Node 에서 돈다.
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        location: 'readonly',
        history: 'readonly',
        navigator: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        DOMParser: 'readonly',
        URLSearchParams: 'readonly',
        Event: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
];
