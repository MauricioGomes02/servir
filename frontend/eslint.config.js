import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import vueAccessibility from 'eslint-plugin-vuejs-accessibility';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/coverage/**', '**/node_modules/**'] },
  eslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  ...vueAccessibility.configs['flat/recommended'],
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2022 },
      parser: vueParser,
      parserOptions: { parser: tseslint.parser, extraFileExtensions: ['.vue'] },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      'vuejs-accessibility/label-has-for': ['error', { required: 'id' }],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/shared/api/*', '@/shared/ui/*'],
              message: 'Consume the module public API instead of a deep import.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['applications/web/src/shared/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/pages/**', '@/features/**', '@/entities/**', '@/modules/**'],
              message: 'Shared code cannot depend on product or application layers.',
            },
            {
              group: ['@/shared/api/*', '@/shared/ui/*'],
              message: 'Consume the module public API instead of a deep import.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['applications/web/src/entities/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/pages/**', '@/features/**', '@/modules/**'],
              message: 'Entities can depend only on entities and shared code.',
            },
            {
              group: ['@/shared/api/*', '@/shared/ui/*'],
              message: 'Consume the module public API instead of a deep import.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['applications/web/src/features/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/pages/**', '@/modules/**'],
              message: 'Features cannot depend on pages, app, or legacy modules.',
            },
            {
              group: ['@/shared/api/*', '@/shared/ui/*'],
              message: 'Consume the module public API instead of a deep import.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['applications/web/src/pages/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/**', '@/modules/**'],
              message: 'Pages cannot depend on app or legacy modules.',
            },
            {
              group: ['@/shared/api/*', '@/shared/ui/*'],
              message: 'Consume the module public API instead of a deep import.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
