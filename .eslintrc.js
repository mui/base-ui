const baseline = require('@mui/monorepo/.eslintrc');
const path = require('path');

const OneLevelImportMessage = [
  'Prefer one level nested imports to avoid bundling everything in dev mode or breaking CJS/ESM split.',
  'See https://github.com/mui/material-ui/pull/24147 for the kind of win it can unlock.',
].join('\n');

const NO_RESTRICTED_IMPORTS_PATTERNS_DEEPLY_NESTED = [
  {
    group: ['@base_ui/react/*/*', '!@base_ui/react/legacy/*'],
    message: OneLevelImportMessage,
  },
];

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
    // TODO move to @mui/monorepo, codebase is moving away from default exports https://github.com/mui/material-ui/issues/21862
    'import/prefer-default-export': 'off',
    'import/export': 'off', // Mostly handled by Typescript itself. ESLint produces false positives with declaration merging.
    'no-restricted-imports': [
      'error',
      {
        patterns: NO_RESTRICTED_IMPORTS_PATTERNS_DEEPLY_NESTED,
      },
    ],
    '@typescript-eslint/no-redeclare': 'off',
  },
  overrides: [
    ...baseline.overrides.filter(
      (ruleSet) => !ruleSet.rules.hasOwnProperty('filenames/match-exported'),
    ),
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
      files: ['packages/**/*.test{.tsx,.js}'],
      excludedFiles: 'packages/mui-base/src/legacy/**/*.*',
      extends: ['plugin:testing-library/react'],
      rules: {
        'testing-library/prefer-screen-queries': 'off', // TODO: enable and fix
        'testing-library/no-container': 'off', // TODO: enable and fix
        'testing-library/render-result-naming-convention': 'off', // False positives
      },
    },
    {
      files: ['docs/**/*{.ts,.tsx,.js}'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: NO_RESTRICTED_IMPORTS_PATTERNS_DEEPLY_NESTED,
          },
        ],
        'react/prop-types': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
      },
    },
    {
      files: ['docs/data/**/*{.tsx,.js}'],
      excludedFiles: [
        'docs/data/**/css/*{.tsx,.js}',
        'docs/data/**/css-modules/*{.tsx,.js}',
        'docs/data/**/system/*{.tsx,.js}',
        'docs/data/**/tailwind/*{.tsx,.js}',
      ],
      rules: {
        'filenames/match-exported': ['error'],
      },
    },
  ],
};
