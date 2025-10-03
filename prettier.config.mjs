import { createBaseConfig } from '@mui/internal-code-infra/prettier';

const base = createBaseConfig();

export default {
  ...base,
  tailwindStylesheet: 'docs/src/styles.css',
  plugins: ['prettier-plugin-tailwindcss'],
};
