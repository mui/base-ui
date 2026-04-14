import * as React from 'react';
import { Tooltip } from '@base-ui/react/tooltip';
import { TypesDataProvider } from '@mui/internal-docs-infra/useType';
import { PackageManagerSnippetProvider } from 'docs/src/blocks/PackageManagerSnippet/PackageManagerSnippetProvider';

export function DocsProviders({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip.Provider delay={350}>
      <TypesDataProvider>
        <PackageManagerSnippetProvider defaultValue="npm">{children}</PackageManagerSnippetProvider>
      </TypesDataProvider>
    </Tooltip.Provider>
  );
}
