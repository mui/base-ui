import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import Tailwind from './tailwind';
import ClientProvider from './client';

export const DemoReactHookForm = createDemoWithVariants(
  import.meta.url,
  { Tailwind },
  { ClientProvider },
);
