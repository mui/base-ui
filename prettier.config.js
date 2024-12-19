const baseline = require('@mui/monorepo/prettier.config');

module.exports = {
  ...baseline,
  plugins: ['prettier-plugin-tailwindcss'], // TODO move to baseline config
  tailwindStylesheet: './docs/src/styles.css',
  overrides: [
    {
      files: ['docs/**/*.md', 'docs/src/app/**/*.{js,tsx}'],
      options: {
        // otherwise code blocks overflow on the docs website
        // The container is 751px
        printWidth: 85,
      },
    },
    {
      files: ['**/*.json'],
      options: {
        trailingComma: 'none',
      },
    },
  ],
};
