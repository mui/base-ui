'use client';
import * as React from 'react';
import type { Drawer } from '@base-ui/react/drawer';

export const MobileNavContext = React.createContext<{
  handle: Drawer.Handle<unknown> | null;
  searchValue: string;
  setSearchValue: (value: string) => void;
}>({
  handle: null,
  searchValue: '',
  setSearchValue: () => undefined,
});
