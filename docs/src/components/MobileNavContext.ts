'use client';
import * as React from 'react';

export const MobileNavContext = React.createContext<{
  close: () => void;
  closeAndScrollTop: () => void;
  closeAndScrollTopAfterNavigation: (nextPathname: string) => void;
}>({
  close: () => {},
  closeAndScrollTop: () => {},
  closeAndScrollTopAfterNavigation: () => {},
});
