import { createDemoWithVariants } from 'docs/src/utils/createDemo';
import CssModules from './css-modules';
import ClientProvider from './client';

export const DemoUseRenderRender = createDemoWithVariants(
  import.meta.url,
  { CssModules },
  { highlightAfter: 'init', enhanceAfter: 'init', ClientProvider },
);
