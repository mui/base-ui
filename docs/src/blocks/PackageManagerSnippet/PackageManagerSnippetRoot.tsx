'use client';

import * as React from 'react';
import { PackageManagerSnippetContext } from './PackageManagerSnippetContext';

export function PackageManagerSnippetRoot(props: PackageManagerSnippetRoot.Props) {
  const { children, value, onValueChange } = props;

  React.useEffect(() => {
    const storedValue = localStorage.getItem('package-manager');
    if (storedValue != null) {
      onValueChange(storedValue);
    }
  }, [onValueChange]);

  React.useEffect(() => {
    localStorage.setItem('package-manager', value);
  }, [value]);

  const contextValue = React.useMemo(() => ({ value, onValueChange }), [value, onValueChange]);

  return (
    <PackageManagerSnippetContext.Provider value={contextValue}>
      {children}
    </PackageManagerSnippetContext.Provider>
  );
}

export namespace PackageManagerSnippetRoot {
  export type Props = {
    children: React.ReactNode;
    value: string;
    onValueChange: (value: string) => void;
  };
}
