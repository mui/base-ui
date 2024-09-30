import * as React from 'react';

export interface ScrollAreaRootContext {
  dir: string | undefined;
  hovering: boolean;
  setHovering: React.Dispatch<React.SetStateAction<boolean>>;
  scrolling: boolean;
  setScrolling: React.Dispatch<React.SetStateAction<boolean>>;
  viewportRef: React.RefObject<HTMLDivElement>;
  scrollbarYRef: React.RefObject<HTMLDivElement>;
  thumbYRef: React.RefObject<HTMLDivElement>;
  scrollbarXRef: React.RefObject<HTMLDivElement>;
  thumbXRef: React.RefObject<HTMLDivElement>;
  handlePointerDown: (event: React.PointerEvent) => void;
  handlePointerMove: (event: React.PointerEvent) => void;
  handlePointerUp: (event: React.PointerEvent) => void;
}

export const ScrollAreaRootContext = React.createContext<ScrollAreaRootContext | null>(null);

if (process.env.NODE_ENV !== 'production') {
  ScrollAreaRootContext.displayName = 'ScrollAreaRootContext';
}

export function useScrollAreaRootContext() {
  const context = React.useContext(ScrollAreaRootContext);
  if (context === null) {
    throw new Error('Base UI: ScrollAreaRootContext is undefined.');
  }
  return context;
}
