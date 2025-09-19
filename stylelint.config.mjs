export default {
  extends: '@mui/internal-code-infra/stylelint',
  defaultSeverity: 'warning', // TODO, remove
  rules: {
    // empty lines help with readability
    'declaration-empty-line-before': null,
    'custom-property-empty-line-before': null,
    'comment-empty-line-before': null,
    'at-rule-empty-line-before': null,
    'number-max-precision': 5,
  },
};
