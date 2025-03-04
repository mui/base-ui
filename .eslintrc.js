const baseline = require('@mui/monorepo/.eslintrc');

const OneLevelImportMessage = [
  'Prefer one level nested imports to avoid bundling everything in dev mode or breaking CJS/ESM split.',
  'See https://github.com/mui/material-ui/pull/24147 for the kind of win it can unlock.',
].join('\n');

const NO_RESTRICTED_IMPORTS_PATTERNS_DEEPLY_NESTED = [
  {
    group: ['@base-ui-components/react/*/*'],
    message: OneLevelImportMessage,
  },
];

module.exports = {
  ...baseline,
  settings: {
    'import/resolver': {
      typescript: {
        project: ['docs/tsconfig.json', 'packages/*/tsconfig.test.json'],
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
    // We LOVE non-breaking spaces, and both straight and curly quotes here
    'no-irregular-whitespace': [1, { skipJSXText: true, skipStrings: true }],
    'react/no-unescaped-entities': [1, { forbid: ['>', '}'] }],
    'material-ui/straight-quotes': 'off',
    // This prevents us from creating components like `<h1 {...props} />`
    'jsx-a11y/heading-has-content': 'off',
    'jsx-a11y/anchor-has-content': 'off',

    // This rule doesn't recognise <label> wrapped around custom controls
    'jsx-a11y/label-has-associated-control': 'off',

    // An overzealous rule that shouts at <a href="#"> in demos.
    'jsx-a11y/anchor-is-valid': 'off',
  },
  overrides: [
    ...baseline.overrides.filter(
      (ruleSet) =>
        !ruleSet.rules.hasOwnProperty('filenames/match-exported') &&
        !ruleSet.extends?.includes('plugin:mocha/recommended'),
    ),
    {
      files: [
        // matching the pattern of the test runner
        '*.test.?(c|m)[jt]s?(x)',
      ],
      rules: {
        // disable eslint-plugin-jsx-a11y
        // tests are not driven by assistive technology
        // add `jsx-a11y` rules once you encounter them in tests
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/control-has-associated-label': 'off',
        'jsx-a11y/iframe-has-title': 'off',
        'jsx-a11y/label-has-associated-control': 'off',
        'jsx-a11y/mouse-events-have-key-events': 'off',
        'jsx-a11y/no-noninteractive-tabindex': 'off',
        'jsx-a11y/no-static-element-interactions': 'off',
        'jsx-a11y/tabindex-no-positive': 'off',

        // In tests this is generally intended.
        'react/button-has-type': 'off',
        // They are accessed to test custom validator implementation with PropTypes.checkPropTypes
        'react/forbid-foreign-prop-types': 'off',
        // components that are defined in test are isolated enough
        // that they don't need type-checking
        'react/prop-types': 'off',
        'react/no-unused-prop-types': 'off',
      },
    },
    {
      files: ['docs/src/app/(private)/experiments/**/*{.tsx,.js}'],
      rules: {
        '@typescript-eslint/no-use-before-define': 'off',
        'react/prop-types': 'off',
        'no-alert': 'off',
        'no-console': 'off',
        'import/no-relative-packages': 'off',
      },
    },
    {
      files: ['docs/src/app/(public)/(content)/react/utils/use-render/demos/**/*{.tsx,.js}'],
      rules: {
        'jsx-a11y/control-has-associated-label': 'off',
        'react/button-has-type': 'off',
      },
    },
    {
      files: ['packages/**/*.test{.tsx,.js}'],
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
      files: ['test/**/*{.ts,.tsx}'],
      rules: {
        'react/prop-types': 'off',
        'guard-for-in': 'off',
      },
    },
  ],
};
