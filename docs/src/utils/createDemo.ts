import 'server-only';

import {
  createDemoFactory,
  createDemoWithVariantsFactory,
  type DemoComponent,
} from '@mui/internal-docs-infra/lite/runtime';
import type * as React from 'react';

import { Demo as DemoContent } from '../components/Demo/Demo';

/**
 * Creates a demo component for displaying code examples with syntax highlighting.
 * @param url Depends on `import.meta.url` to determine the source file location.
 * @param component The component to be rendered in the demo.
 */
const createDemoLite = createDemoFactory({
  DemoContent,
});

export function createDemo(url: string, component: React.ComponentType): DemoComponent {
  return createDemoLite(url, component);
}

/**
 * Creates a demo component for displaying code examples with syntax highlighting.
 * A variant is a different implementation style of the same component.
 * @param url Depends on `import.meta.url` to determine the source file location.
 * @param variants The variants of the component to be rendered in the demo.
 */
const createDemoWithVariantsLite = createDemoWithVariantsFactory({
  DemoContent,
});

export function createDemoWithVariants(
  url: string,
  variants: Record<string, React.ComponentType>,
): DemoComponent {
  return createDemoWithVariantsLite(url, variants);
}
