import base from '@mui/internal-code-infra/stylelint';

// Note: To debug stylelint config resolution for a specific file, use
//         pnpm exec stylelint --print-config <path-to-file>

/** @type {import('stylelint').Config} */
export default {
  extends: base,
  rules: {
    // empty lines help with readability
    'declaration-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'comment-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'function-no-unknown': true,
    'number-max-precision': 5,

    'no-descending-specificity': null, // Some styles depend on order
  },
  overrides: [
    {
      files: ['docs/**/*'],
      extends: ['stylelint-config-tailwindcss'],
      rules: {
        // https://github.com/zhilidali/stylelint-config-tailwindcss/issues/12
        'declaration-property-value-no-unknown': null,
        // Remove when ready
        'keyframes-name-pattern': null,
      },
    },
    {
      // Not fixing experiments for now
      files: ['docs/src/app/[(]private[)]/experiments/**/*'],
      rules: {
        'block-no-redundant-nested-style-rules': null,
        'no-descending-specificity': null,
        'no-duplicate-selectors': null,
      },
    },
  ],
};
