'use client';
import * as React from 'react';
import * as BasePackageManagerSnippet from '../../blocks/PackageManagerSnippet';
import classes from './PackageManagerSnippet.module.css';
import * as CodeBlock from '../CodeBlock';

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
    <div>
      <BasePackageManagerSnippet.Root
        options={packageManagers}
        // eslint-disable-next-line jsx-a11y/control-has-associated-label, react/button-has-type
        renderTab={<button className={classes.tab} />}
        renderTabsList={(tabsListProps) => <div {...tabsListProps} className={classes.tabsList} />}
      >
        {props.children}
      </BasePackageManagerSnippet.Root>
    </div>
  );
}

export function Npm(props: React.PropsWithChildren) {
  return (
    <BasePackageManagerSnippet.Code value="npm">
      <CodeBlock.Root className="mt-3 mb-5">
        <CodeBlock.Pre {...props} />
      </CodeBlock.Root>
    </BasePackageManagerSnippet.Code>
  );
}

export function Pnpm(props: React.PropsWithChildren) {
  return (
    <BasePackageManagerSnippet.Code value="pnpm">
      <CodeBlock.Root className="mt-3 mb-5">
        <CodeBlock.Pre {...props} />
      </CodeBlock.Root>
    </BasePackageManagerSnippet.Code>
  );
}

export function Yarn(props: React.PropsWithChildren) {
  return (
    <BasePackageManagerSnippet.Code value="yarn">
      <CodeBlock.Root className="mt-3 mb-5">
        <CodeBlock.Pre {...props} />
      </CodeBlock.Root>
    </BasePackageManagerSnippet.Code>
  );
}
