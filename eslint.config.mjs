import {
  baseSpecRules,
  createBaseConfig,
  createDocsConfig,
  createTestConfig,
  EXTENSION_TEST_FILE,
  EXTENSION_TS,
} from '@mui/internal-code-infra/eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import * as path from 'node:path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const OneLevelImportMessage = [
  'Prefer one level nested imports to avoid bundling everything in dev mode or breaking CJS/ESM split.',
  'See https://github.com/mui/material-ui/pull/24147 for the kind of win it can unlock.',
].join('\n');

const NO_RESTRICTED_IMPORTS_PATTERNS_DEEPLY_NESTED = [
  {
    group: ['@base-ui/react/*/*'],
    message: OneLevelImportMessage,
  },
];

// Add relevant packages to the list below.
const NO_RESTRICTED_IMPORTS_PATHS_TOP_LEVEL_PACKAGES = [
  // { name: string, message: string }
];

export default defineConfig(
  globalIgnores(['./examples']),
  createBaseConfig({
    baseDirectory: dirname,
  }),
  {
    name: 'Base UI overrides',
    files: [`**/*${EXTENSION_TS}`],
    settings: {
      'import/resolver': {
        typescript: {
          project: ['tsconfig.json'],
        },
      },
    },
    /**
     * Sorted alphanumerically within each group. built-in and each plugin form
     * their own groups.
     */
    rules: {
      // @TODO: Remove this once we move away from namespaces
      '@typescript-eslint/no-namespace': 'off',
      'import/export': 'off', // FIXME: Maximum call stack exceeded
      'no-restricted-imports': [
        'error',
        {
          patterns: NO_RESTRICTED_IMPORTS_PATTERNS_DEEPLY_NESTED,
        },
      ],
      // We LOVE non-breaking spaces, and both straight and curly quotes here
      'no-irregular-whitespace': ['warn', { skipJSXText: true, skipStrings: true }],
      'react/react-in-jsx-scope': 'off',
      'react/no-unescaped-entities': ['warn', { forbid: ['>', '}'] }],
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': [
        'error',
        {
          additionalHooks: 'useIsoLayoutEffect',
        },
      ],
      // This prevents us from creating components like `<h1 {...props} />`
      'jsx-a11y/heading-has-content': 'off',
      'jsx-a11y/anchor-has-content': 'off',

      // This rule doesn't recognise <label> wrapped around custom controls
      'jsx-a11y/label-has-associated-control': 'off',
      // Turn off new eslint-plugin-react-hooks rules till we can fix all warnings
      'react-hooks/globals': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/refs': 'off',

      // TODO (@Janpot) REconfigure test env to not use production guard
      'mui/consistent-production-guard': 'off',
    },
  },
  {
    files: [`packages/*/src/**/*${EXTENSION_TS}`],
    ignores: [`**/*${EXTENSION_TEST_FILE}`, `test/**/*${EXTENSION_TS}`],
    rules: {
      'mui/add-undef-to-optional': 'error',
    },
  },
  {
    files: [
      // matching the pattern of the test runner
      `**/*${EXTENSION_TEST_FILE}`,
    ],
    extends: createTestConfig({ useMocha: false }),
    rules: {
      'mui/add-undef-to-optional': 'off',
    },
  },
  baseSpecRules,
  {
    name: 'MUI ESLint config for docs',
    files: [`docs/**/*${EXTENSION_TS}`],
    extends: createDocsConfig(),
    rules: {
      '@typescript-eslint/no-use-before-define': 'off',
      'import/extensions': [
        'error',
        // Ignores extensions in package imports as well as local ts/tsx imports but .mjs is always required
        'ignorePackages',
        {
          ts: 'never',
          tsx: 'never',
          mjs: 'always',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: NO_RESTRICTED_IMPORTS_PATHS_TOP_LEVEL_PACKAGES,
          patterns: NO_RESTRICTED_IMPORTS_PATTERNS_DEEPLY_NESTED,
        },
      ],
    },
  },
  {
    files: [`docs/src/app/(private)/experiments/**/*${EXTENSION_TS}`],
    rules: {
      '@typescript-eslint/no-use-before-define': 'off',
      'no-alert': 'off',
      'no-console': 'off',
      'import/no-relative-packages': 'off',
    },
  },
  {
    files: [`docs/src/app/(docs)/react/utils/use-render/demos/**/*${EXTENSION_TS}`],
    rules: {
      'jsx-a11y/control-has-associated-label': 'off',
      'react/button-has-type': 'off',
    },
  },
  {
    name: 'Disable image rule for demos',
    files: [
      `docs/src/app/(docs)/**/demos/**/*${EXTENSION_TS}`,
      `docs/src/app/(private)/experiments/**/*${EXTENSION_TS}`,
    ],
    ignores: ['docs/src/app/(private)/experiments/**/page.tsx'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
  {
    files: [`test/**/*${EXTENSION_TS}`],
    rules: {
      'guard-for-in': 'off',
      'testing-library/prefer-screen-queries': 'off', // Enable usage of playwright queries
      'testing-library/no-await-sync-queries': 'off',
      'testing-library/render-result-naming-convention': 'off', // inconsequential in regression tests
      'mui/consistent-production-guard': 'off',
    },
  },
);
