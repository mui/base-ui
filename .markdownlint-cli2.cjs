const baseline = require('@mui/monorepo/.markdownlint-cli2.cjs');

module.exports = {
  ...baseline,
  config: {
    ...baseline.config,
    MD038: false, // false poisitives in MDX
  },
};
