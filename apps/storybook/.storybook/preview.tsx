import type { Preview } from '@storybook/react-vite';
import '../src/styles/theme.css';

const preview: Preview = {
  parameters: {
    layout: 'centered',

    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
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
          'Form inputs',
          'Overlays',
          'Navigation',
          'Disclosure & structure',
          'Actions',
          'Status & display',
          'Utilities',
          'Research',
          ['About this research', 'The brief (PROMPT)', 'Progress ledger', 'Final report (SUMMARY)'],
        ],
      },
    },
  },
};

export default preview;
