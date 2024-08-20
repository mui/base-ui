'use client';

import * as React from 'react';
import clsx from 'clsx';
import * as BasePackageManagerSnippet from '../../blocks/PackageManagerSnippet';
import classes from './PackageManagerSnippet.module.css';

interface PackageManagerSnippetProps {
  children: React.ReactNode;
}

const packageManagers = ['npm', 'pnpm', 'Yarn'];

export function PackageManagerSnippet(props: PackageManagerSnippetProps) {
  const [value, setValue] = React.useState(localStorage.getItem('package-manager') ?? 'npm');

  return (
    <div className={classes.root}>
      <div className={classes.selectorArea}>
        <div role="group" aria-label="Package manager selector" className={classes.selector}>
          {packageManagers.map((packageManager) => (
            <button
              type="button"
              key={packageManager}
              onClick={() => setValue(packageManager)}
              className={clsx({ [classes.selected]: value === packageManager }, classes.button)}
              aria-pressed={value === packageManager}
            >
              {packageManager}
            </button>
          ))}
        </div>
      </div>
      <BasePackageManagerSnippet.Root value={value} onValueChange={setValue}>
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
    <BasePackageManagerSnippet.Code value="Yarn">
      <pre className={classes.code}>{props.children}</pre>
    </BasePackageManagerSnippet.Code>
  );
}
