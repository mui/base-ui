import type { Config } from 'tailwindcss';

// Handy link to the default config:
// https://github.com/tailwindlabs/tailwindcss/blob/main/stubs/config.full.js

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
        '3xl': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.015em' }],
        '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.015em' }],
        '6xl': ['3.75rem', { lineHeight: '0.95', letterSpacing: '-0.015em' }],
      },
    },
  },
} satisfies Config;
