'use client';

import * as React from 'react';
import { PackageManagerSnippetContext } from './PackageManagerSnippetContext';

export function PackageManagerSnippetCode(props: PackageManagerSnippetCode.Props) {
  const { value, children } = props;

  const context = React.useContext(PackageManagerSnippetContext);
  if (context == null) {
    throw new Error('PackageManagerSnippet.Code must be used within a PackageManagerSnippet.Root');
  }

  if (context.value !== value) {
    return null;
  }

  return children;
}

export namespace PackageManagerSnippetCode {
  export type Props = {
    children: React.ReactNode;
    value: string;
  };
}
