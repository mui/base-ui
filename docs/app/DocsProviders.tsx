import * as React from 'react';
import * as Tooltip from '@base_ui/react/Tooltip';
import { DemoVariantSelectorProvider } from 'docs-base/src/components/demo/DemoVariantSelectorProvider';
import { PackageManagerSnippetProvider } from 'docs-base/src/blocks/PackageManagerSnippet/PackageManagerSnippetProvider';

export function DocsProviders({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Provider delay={350}>
      <DemoVariantSelectorProvider defaultVariant="css-modules" defaultLanguage="ts">
        <PackageManagerSnippetProvider defaultValue="npm">{children}</PackageManagerSnippetProvider>
      </DemoVariantSelectorProvider>
    </Tooltip.Provider>
  );
}
