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
    },
  },
  prettier,
);
