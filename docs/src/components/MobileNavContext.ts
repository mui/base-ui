'use client';
import * as React from 'react';

export const MobileNavContext = React.createContext<{
  close: () => void;
  closeAndScrollTop: () => void;
}>({
  close: () => {},
  closeAndScrollTop: () => {},
});
