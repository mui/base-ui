'use client';

import * as React from 'react';
import { ToggleButtonGroup } from 'docs-base/src/design-system/ToggleButtonGroup';
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

function getStoredValue() {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return localStorage.getItem('package-manager') || 'npm';
  }

  return 'npm';
}

export function PackageManagerSnippet(props: PackageManagerSnippetProps) {
  const [value, setValue] = React.useState('npm');

  React.useEffect(() => {
    setValue(getStoredValue());
  }, []);

  return (
    <div className={classes.root}>
      <div className={classes.selectorArea}>
        <ToggleButtonGroup
          options={packageManagers}
          value={value}
          onValueChange={(v) => setValue(v.value)}
          aria-label="Package manager selector"
        />
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
    <BasePackageManagerSnippet.Code value="yarn">
      <pre className={classes.code}>{props.children}</pre>
    </BasePackageManagerSnippet.Code>
  );
}
