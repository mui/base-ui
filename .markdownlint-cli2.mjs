import { createBaseConfig } from '@mui/internal-code-infra/markdownlint';

const baseConfig = createBaseConfig();

export default {
  ...baseConfig,
  config: {
    ...baseConfig.config,
    MD038: false, // false poisitives in MDX
  },
};
