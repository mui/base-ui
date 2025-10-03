import { createBaseConfig } from '@mui/internal-code-infra/prettier';

const base = createBaseConfig();

export default {
  ...base,
  tailwindPreserveWhitespace: true,
  plugins: ['prettier-plugin-tailwindcss'],
};
