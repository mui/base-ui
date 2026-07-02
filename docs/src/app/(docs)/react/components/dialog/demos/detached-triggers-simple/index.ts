import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';
import Tailwind from './tailwind';
import ClientProvider from './client';

export const DemoDialogDetachedTriggersSimple = createDemoWithVariants(
  import.meta.url,
  { CssModules, Tailwind },
  { ClientProvider },
);
