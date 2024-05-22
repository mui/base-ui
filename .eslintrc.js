const baseline = require('@mui/monorepo/.eslintrc');
const path = require('path');

module.exports = {
  ...baseline,
  settings: {
    'import/resolver': {
      webpack: {
        config: path.join(__dirname, './webpackBaseConfig.js'),
      },
    },
  },
  /**
   * Sorted alphanumerically within each group. built-in and each plugin form
   * their own groups.
   */
  rules: {
    ...baseline.rules,
    // TODO move to @mui/monorepo, codebase is moving away from default exports
    'import/prefer-default-export': 'off',
  },
  overrides: [
    ...baseline.overrides,
    {
      files: ['docs/pages/experiments/**/*{.tsx,.js}', 'docs/pages/playground/**/*{.tsx,.js}'],
      rules: {
        '@typescript-eslint/no-use-before-define': 'off',
        'react/prop-types': 'off',
        'no-alert': 'off',
        'no-console': 'off',
      },
    },
    {
      files: ['packages/mui-base/src/legacy/**/*.*'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
};
