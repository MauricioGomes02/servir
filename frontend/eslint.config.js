import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import vueAccessibility from 'eslint-plugin-vuejs-accessibility';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

const publicModuleApi = {
  group: ['@/pages/*/*', '@/features/*/*', '@/entities/*/*', '@/shared/api/*', '@/shared/ui/*'],
  message: 'Consume the module public API instead of a deep import.',
};

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
          patterns: [publicModuleApi],
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
            publicModuleApi,
            {
              group: ['@/app/**', '@/pages/**', '@/features/**', '@/entities/**', '@/modules/**'],
              message: 'Shared code cannot depend on product or application layers.',
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
            publicModuleApi,
            {
              group: ['@/app/**', '@/pages/**', '@/features/**', '@/modules/**'],
              message: 'Entities can depend only on entities and shared code.',
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
            publicModuleApi,
            {
              group: ['@/app/**', '@/pages/**', '@/modules/**'],
              message: 'Features cannot depend on pages, app, or legacy modules.',
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
            publicModuleApi,
            {
              group: ['@/app/**', '@/modules/**'],
              message: 'Pages cannot depend on app or legacy modules.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['applications/bff/src/modules/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../activities/**',
                '../members/**',
                '../ministries/**',
                '../organizations/**',
                '../../authentication/**',
                '../../http/**',
                '../../create-application*',
              ],
              message:
                'BFF route modules can depend on shared mechanisms, not sibling modules or composition.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['applications/bff/src/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../modules/**',
                '../authentication/**',
                '../http/**',
                '../create-application*',
              ],
              message: 'BFF shared mechanisms cannot depend on product routes or entry adapters.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
