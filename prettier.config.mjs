import { createBaseConfig } from '@mui/internal-code-infra/prettier';

const base = createBaseConfig();

export default {
  ...base,
  plugins: ['prettier-plugin-tailwindcss'],
};
