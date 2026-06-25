import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';
import ClientProvider from './client';

export const DemoAnimatedSelectMotion = createDemoWithVariants(
  import.meta.url,
  { CssModules },
  { ClientProvider },
);
