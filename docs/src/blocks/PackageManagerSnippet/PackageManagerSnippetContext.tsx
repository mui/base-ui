'use client';

import * as React from 'react';

export interface PackageManagerSnippetContext {
  value: string;
  onValueChange: (value: string) => void;
}

export const PackageManagerSnippetContext = React.createContext<
  PackageManagerSnippetContext | undefined
>(undefined);
