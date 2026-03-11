import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';

export const DemoTreeLazyLoading = createDemoWithVariants(import.meta.url, {
  CssModules,
});
