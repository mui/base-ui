import { createDemoGlobalWithVariants } from '@mui/internal-docs-infra/createDemoData';
import type { DemoGlobalData } from '@mui/internal-docs-infra/createDemoData/types';
import { DemoThemeProvider as CssModules } from './css-modules';

export const DemoDataTheme: DemoGlobalData = createDemoGlobalWithVariants(import.meta.url, {
  CssModules,
});
