import { createBaseConfig } from '@mui/internal-code-infra/markdownlint';

const baseline = createBaseConfig();

export default {
  ...baseline,
  config: {
    ...baseline.config,
    MD038: false, // false positives in MDX
  },
};
