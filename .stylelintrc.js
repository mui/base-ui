const baseline = require('@mui/monorepo/.stylelintrc');

// TODO remove. In theory, deleting these lines should just work.
delete baseline.rules['declaration-colon-newline-after'];
delete baseline.rules['function-parentheses-newline-inside'];
delete baseline.rules['no-missing-end-of-source-newline'];
delete baseline.rules['value-list-comma-newline-after'];

module.exports = {
  ...baseline,
  // TODO remove. In theory, deleting the "ignoreFiles" key should just work.
  ignoreFiles: ['**/*.d.ts', 'docs/.next/**/*', 'docs/export/**/*', '**/node_modules/**/*'],
};
