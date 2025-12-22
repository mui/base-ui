import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { DemoVariantSelectorProvider } from 'docs/src/components/Demo/DemoVariantSelectorProvider';
import { PackageManagerSnippetProvider } from 'docs/src/blocks/PackageManagerSnippet/PackageManagerSnippetProvider';

export function DocsProviders({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Provider delay={350}>
      <DemoVariantSelectorProvider defaultVariant="css-modules" defaultLanguage="ts">
        <PackageManagerSnippetProvider defaultValue="npm">{children}</PackageManagerSnippetProvider>
      </DemoVariantSelectorProvider>
    </Tooltip.Provider>
  );
}
