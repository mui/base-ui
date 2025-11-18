import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';

export const DemoSelectTyped = createDemoWithVariants(import.meta.url, {
  CssModules,
});
