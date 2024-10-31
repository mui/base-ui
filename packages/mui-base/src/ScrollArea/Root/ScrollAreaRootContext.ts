import * as React from 'react';

export interface ScrollAreaRootContext {
  dir: string | undefined;
  type: 'overlay' | 'inset';
  gutter?: 'stable' | 'both-edges' | 'none';
  cornerSize: { width: number; height: number };
  setCornerSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  thumbSize: { width: number; height: number };
  setThumbSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  hovering: boolean;
  setHovering: React.Dispatch<React.SetStateAction<boolean>>;
  scrolling: boolean;
  setScrolling: React.Dispatch<React.SetStateAction<boolean>>;
  viewportRef: React.RefObject<HTMLDivElement>;
  scrollbarYRef: React.RefObject<HTMLDivElement>;
  thumbYRef: React.RefObject<HTMLDivElement>;
  scrollbarXRef: React.RefObject<HTMLDivElement>;
  thumbXRef: React.RefObject<HTMLDivElement>;
  cornerRef: React.RefObject<HTMLDivElement>;
  handlePointerDown: (event: React.PointerEvent) => void;
  handlePointerMove: (event: React.PointerEvent) => void;
  handlePointerUp: (event: React.PointerEvent) => void;
  rootId: string | undefined;
  hiddenState: {
    scrollbarYHidden: boolean;
    scrollbarXHidden: boolean;
    cornerHidden: boolean;
  };
  setHiddenState: React.Dispatch<
    React.SetStateAction<{
      scrollbarYHidden: boolean;
      scrollbarXHidden: boolean;
      cornerHidden: boolean;
    }>
  >;
}

export const ScrollAreaRootContext = React.createContext<ScrollAreaRootContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  ScrollAreaRootContext.displayName = 'ScrollAreaRootContext';
}

export function useScrollAreaRootContext() {
  const context = React.useContext(ScrollAreaRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ScrollAreaRootContext is missing. ScrollArea parts must be placed within <ScrollArea.Root>.',
    );
  }
  return context;
}
