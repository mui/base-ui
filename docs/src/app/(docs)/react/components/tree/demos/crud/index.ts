import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';

export const DemoTreeCrud = createDemoWithVariants(import.meta.url, {
  CssModules,
});
