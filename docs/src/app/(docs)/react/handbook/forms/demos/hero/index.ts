import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import Tailwind from './tailwind';
import ClientProvider from './client';

export const DemoBaseUIForm = createDemoWithVariants(
  import.meta.url,
  { Tailwind },
  { highlightAfter: 'init', enhanceAfter: 'init', ClientProvider },
);
