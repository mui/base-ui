import * as React from 'react';
import * as DocsComponents from 'docs-base/src/modules/components';
import classes from './MDXComponents.module.css';
import { Callout, type CalloutProps } from './Callout';
import { PackageManagerSnippet, Npm, Pnpm, Yarn } from './PackageManagerSnippet';

export const components = {
  ...DocsComponents,
  Callout: (props: CalloutProps) => <Callout {...props} />,
  ComponentLinkHeader: () => (
    <DocsComponents.ComponentLinkHeader className={classes.todo}>
      Component links
    </DocsComponents.ComponentLinkHeader>
  ),
  ComponentPageTabs: () => null,
  PackageManagerSnippet: (props: { children: React.ReactNode }) => (
    <PackageManagerSnippet {...props} />
  ),
  Npm: (props: React.PropsWithChildren<{}>) => <Npm>{props.children}</Npm>,
  Pnpm: (props: React.PropsWithChildren<{}>) => <Pnpm>{props.children}</Pnpm>,
  Yarn: (props: React.PropsWithChildren<{}>) => <Yarn>{props.children}</Yarn>,
};
