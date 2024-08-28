'use client';

import * as React from 'react';
import * as Tabs from '@base_ui/react/Tabs';

export function PackageManagerSnippetCode(props: PackageManagerSnippetCode.Props) {
  const { value, children } = props;

  return <Tabs.Panel value={value}>{children}</Tabs.Panel>;
}

export namespace PackageManagerSnippetCode {
  export type Props = {
    children: React.ReactNode;
    value: string;
  };
}
