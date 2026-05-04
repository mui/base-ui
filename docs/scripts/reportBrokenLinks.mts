import { crawl } from '@mui/internal-code-infra/brokenLinksChecker';

async function main() {
  const { issues } = await crawl({
    startCommand: 'pnpm serve --no-request-logging -p 3001',
    host: 'http://localhost:3001/',
    // Target paths to ignore during link checking
    ignoredPaths: [],
    // CSS selectors for content to ignore during link checking
    ignoredContent: [],
    htmlValidate: {
      extends: ['mui:recommended'],
      rules: {
        // Portaled elements (Menu, Select, Autocomplete listbox) and Base UI
        // components render aria-controls/aria-labelledby targets only after
        // client hydration, so they're missing from the static HTML.
        'no-missing-references': 'off',
      },
    },
  });

  process.exit(issues.length);
}

main();
