import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './data/**/*.{js,ts,jsx,tsx}',
    '!./src/design-system/**/*',
  ],
  theme: {
    extend: {
      colors: {
        'color-gridline': 'var(--color-gridline)',
        'color-content': 'var(--color-content)',
        'color-link': 'var(--color-link)',
        'color-gray': 'var(--color-gray)',
        'color-border': 'var(--color-border)',
      },
      fontFamily: {
        sans: '"Unica 77", system-ui',
      },
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1rem', letterSpacing: '0.00125em' }],
        sm: ['0.9375rem', { lineHeight: '1.25rem', letterSpacing: '0.001em' }],
        base: ['1.0625rem', { lineHeight: '1.5rem' }],
        lg: ['1.1875rem', { lineHeight: '1.75rem' }],
        xl: ['1.3125rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.0125em' }],
      },
    },
  },
} satisfies Config;
