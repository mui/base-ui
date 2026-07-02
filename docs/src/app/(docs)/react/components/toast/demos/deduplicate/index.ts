import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';
import ClientProvider from './client';

export const DemoToastDeduplicate = createDemoWithVariants(
  import.meta.url,
  { CssModules },
  { ClientProvider },
);
