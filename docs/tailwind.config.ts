import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

export default {
  darkMode: ['class', '[data-color-scheme="dark"]'],
  content: [
    // Apply only to demos
    './data/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Graphik', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  corePlugins: {
    // Remove the Tailwind CSS preflight styles as they would apply to the whole site.
    preflight: false,
  },
} satisfies Config;
