import { createBaseConfig } from '@mui/internal-code-infra/markdownlint';

const baseline = createBaseConfig();

export default {
  ...baseline,
  ignores: [...(baseline.ignores ?? []), 'IMPLEMENTATION_SUMMARY.md'],
  config: {
    ...baseline.config,
    MD038: false, // false positives in MDX
    MD041: false, // false positives in MDX
  },
};
