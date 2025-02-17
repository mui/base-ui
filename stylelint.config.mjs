import baseline from '@mui/monorepo/stylelint.config.mjs';

export default {
  ...baseline,
  defaultSeverity: 'warning', // TODO, remove
  rules: {
    ...baseline.rules,
    // empty lines help with readability
    'declaration-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'comment-empty-line-before': null,
    'at-rule-empty-line-before': null,

    // our bundler understands the simple notation we use
    'import-notation': null,

    // makes it harder to change
    'color-hex-length': null,

    // Tailwind
    'at-rule-no-unknown': [true, { ignoreAtRules: ['theme'] }],
  },
};
