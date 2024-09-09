'use client';

import * as React from 'react';
import * as BasePackageManagerSnippet from '../../blocks/PackageManagerSnippet';
import classes from './PackageManagerSnippet.module.css';

interface PackageManagerSnippetProps {
  children: React.ReactNode;
}

const packageManagers = [
  {
    value: 'npm',
    label: 'npm',
  },
  { value: 'pnpm', label: 'pnpm' },
  {
    value: 'yarn',
    label: 'Yarn',
  },
];

export function PackageManagerSnippet(props: PackageManagerSnippetProps) {
  return (
    <div className={classes.root}>
      <BasePackageManagerSnippet.Root
        options={packageManagers}
        // eslint-disable-next-line jsx-a11y/control-has-associated-label, react/button-has-type
        renderTab={<button className={classes.tab} />}
        renderTabsList={(tabsListProps) => (
          <div className={classes.header}>
            <div {...tabsListProps} className={classes.tabsList} />
          </div>
        )}
      >
        {props.children}
      </BasePackageManagerSnippet.Root>
    </div>
  );
}

export function Npm(props: React.PropsWithChildren<{}>) {
  return (
    <BasePackageManagerSnippet.Code value="npm">
      <pre className={classes.code}>{props.children}</pre>
    </BasePackageManagerSnippet.Code>
  );
}

export function Pnpm(props: React.PropsWithChildren<{}>) {
  return (
    <BasePackageManagerSnippet.Code value="pnpm">
      <pre className={classes.code}>{props.children}</pre>
    </BasePackageManagerSnippet.Code>
  );
}

export function Yarn(props: React.PropsWithChildren<{}>) {
  return (
    <BasePackageManagerSnippet.Code value="yarn">
      <pre className={classes.code}>{props.children}</pre>
    </BasePackageManagerSnippet.Code>
  );
}
