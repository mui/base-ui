import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';
import ClientProvider from './client';

export const DemoCheckboxGroupParent = createDemoWithVariants(
  import.meta.url,
  { CssModules },
  { ClientProvider },
);
