import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';
import Tailwind from './tailwind';
import ClientProvider from './client';

export const DemoPopoverHero = createDemoWithVariants(
  import.meta.url,
  { CssModules, Tailwind },
  { highlightAfter: 'init', enhanceAfter: 'init', ClientProvider },
);
