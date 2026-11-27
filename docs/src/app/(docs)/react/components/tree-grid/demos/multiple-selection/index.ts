import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';
import Tailwind from './tailwind';

export const DemoTreeGridMultipleSelection = createDemoWithVariants(import.meta.url, {
  CssModules,
  Tailwind,
});
