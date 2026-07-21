import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/styles/theme.css';

const preview: Preview = {
  // Declares the `theme` global (same key the addon-themes preset registers) with
  // light as the startup theme; also lets iframe URLs override it via
  // &globals=theme:dark.
  initialGlobals: {
    theme: 'light',
  },

  decorators: [
    // Toolbar theme picker + `theme` global. Stamps data-theme on <html>, which
    // src/styles/theme.css keys the semantic --ds-color-* vars on.
    withThemeByDataAttribute({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
  parameters: {
    layout: 'centered',

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    docs: {
      // Show top-level section headings only (h2). Components list up to 19 API parts as h3
      // under "API reference", plus many behavior + recreation h3s — including them overflows
      // the sticky TOC and pushes sections like "In the wild" below the fold.
      toc: {
        headingSelector: 'h2',
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },

    options: {
      storySort: {
        order: [
          'Overview',
          ['Introduction', 'Principles', 'Choosing components'],
          'Patterns',
          [
            'Build a validated form',
            'Choosing an overlay',
            'Pickers: select, combobox, autocomplete',
            'Menus & navigation',
            'Composite keyboard navigation',
            'Animating open and close',
          ],
          'Form inputs',
          'Overlays',
          'Navigation',
          'Disclosure & structure',
          'Actions',
          'Status & display',
          'Utilities',
          'Research',
          [
            'About this research',
            'The brief (PROMPT)',
            'Progress ledger',
            'Final report (SUMMARY)',
          ],
        ],
      },
    },
  },
};

export default preview;
