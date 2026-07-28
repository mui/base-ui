import { crawl } from '@mui/internal-code-infra/brokenLinksChecker';

async function main() {
  const { issues } = await crawl({
    startCommand: 'pnpm serve --no-request-logging -p 3001',
    host: 'http://localhost:3001/',
    // Target paths to ignore during link checking
    ignoredPaths: [],
    // CSS selectors for content to ignore during link checking
    ignoredContent: [],
    htmlValidate: [
      // Validate every page with `mui:recommended` (applied automatically).
      { config: true },
      {
        // The Accordion hero demo renders `Accordion.Header` as `<h3>` (Base UI's
        // default, following the ARIA APG) right after the page's `<h1>`, before
        // the first `<h2>`. That's a genuine heading-level skip which html-validate
        // can only silence with an inline directive comment scoped to the demo
        // subtree — and React can't emit HTML comments into the static export. Turn
        // the rule off for this page rather than distort the canonical demo.
        path: '/react/components/accordion',
        config: {
          rules: {
            'heading-level': 'off',
          },
        },
      },
      {
        // The Forms handbook page renders multiple Combobox demos. During SSR the
        // Combobox emits its `React.useId()`-based id on both the trigger and the
        // hidden input, so the static export momentarily contains duplicate ids —
        // they diverge again once React hydrates on the client. This is a
        // library-level SSR artifact, not something the docs can fix, so turn the
        // rule off for this page.
        // TODO: Fix Combobox to render distinct ids on the trigger and the hidden
        // input during SSR (`ComboboxInput`/`ComboboxTrigger`), then remove this
        // override.
        path: '/react/handbook/forms',
        config: {
          rules: {
            'no-dup-id': 'off',
          },
        },
      },
    ],
  });

  process.exit(issues.length);
}

main();
