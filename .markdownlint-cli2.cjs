const baseline = require('@mui/monorepo/.markdownlint-cli2.cjs');

module.exports = {
  ...baseline,
  config: {
    ...baseline.config,
    // MDX files can contain imports and comments before the title
    MD041: false,
  },
};
