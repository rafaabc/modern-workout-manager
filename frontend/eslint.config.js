import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  // Config files run in Node.js — provide Node globals so `process` etc. are recognised
  {
    files: ['*.config.js', '*.config.mjs', '**/*.config.js', '**/*.config.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
];
