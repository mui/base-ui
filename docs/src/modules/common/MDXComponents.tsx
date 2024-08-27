import * as React from 'react';
import { ComponentLinkHeader, InstallationInstructions } from 'docs-base/src/modules/components';
import { Callout } from 'docs-base/src/modules/common/Callout';
import { PackageManagerSnippet, Npm, Pnpm, Yarn } from './PackageManagerSnippet';

export const components = {
  Callout,
  ComponentLinkHeader,
  PackageManagerSnippet: (props: { children: React.ReactNode }) => (
    <PackageManagerSnippet {...props} />
  ),
  Npm: (props: React.PropsWithChildren<{}>) => <Npm>{props.children}</Npm>,
  Pnpm: (props: React.PropsWithChildren<{}>) => <Pnpm>{props.children}</Pnpm>,
  Yarn: (props: React.PropsWithChildren<{}>) => <Yarn>{props.children}</Yarn>,
  InstallationInstructions,
};
