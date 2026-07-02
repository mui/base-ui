import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';
import Tailwind from './tailwind';
import ClientProvider from './client';

export const DemoMenuArrow = createDemoWithVariants(
  import.meta.url,
  { CssModules, Tailwind },
  { ClientProvider },
);
