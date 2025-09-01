import globals from 'globals';
import tseslint from 'typescript-eslint';

import baseConfig from '../eslint.config.mjs';

export default tseslint.config(
  ...baseConfig,
  {
    ignores: ['.angular/**', 'karma.conf.js'],
    languageOptions: {
      globals: globals.browser,
      sourceType: 'module',
    },
  },
);
