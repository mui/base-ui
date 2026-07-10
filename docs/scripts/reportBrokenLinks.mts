import { crawl } from '@mui/internal-code-infra/brokenLinksChecker';

async function main() {
  const { issues } = await crawl({
    startCommand: 'pnpm serve --no-request-logging -p 3001',
    host: 'http://localhost:3001/',
    // `pnpm serve` does not apply Netlify redirects; this path is valid in production.
    ignoredPaths: [/^\/r\/discord$/],
    // CSS selectors for content to ignore during link checking
    ignoredContent: [],
  });

  process.exit(issues.length);
}

main();
