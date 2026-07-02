import { crawl } from '@mui/internal-code-infra/brokenLinksChecker';

async function main() {
  const { issues } = await crawl({
    startCommand: 'pnpm serve --no-request-logging -p 3001',
    host: 'http://localhost:3001/',
    // Target paths to ignore during link checking
    ignoredPaths: [],
    // CSS selectors for content to ignore during link checking
    ignoredContent: [],
    // `mui:recommended` is applied automatically as the baseline for every page;
    // each entry below is layered on top as a pure rule patch (no `extends`, so
    // it only changes the rules/elements it names).
    htmlValidate: [
      {
        // Applies to every page (no `path`).
        config: {
          rules: {
            // Portaled elements (Menu, Select, Autocomplete listbox) and Base UI
            // components render aria-controls/aria-labelledby targets only after
            // client hydration, so they're missing from the static HTML.
            'no-missing-references': 'off',
          },
          elements: [
            'html5',
            {
              form: {
                attributes: {
                  // React renders `action="javascript:throw new Error(...)"` on a
                  // <form> with a function action during SSR (a sentinel that throws
                  // if the form is submitted before hydration wires up the real
                  // handler). Permit that value while keeping the default check
                  // (`^\s*\S+\s*$`) for every other action value.
                  action: {
                    enum: ['/^\\s*\\S+\\s*$/', '/^\\s*javascript:throw new Error\\(/'],
                  },
                },
              },
            },
          ],
        },
      },
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
    ],
  });

  process.exit(issues.length);
}

main();
