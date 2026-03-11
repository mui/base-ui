import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';

export const DemoTreeAnimated = createDemoWithVariants(import.meta.url, {
  CssModules,
});
