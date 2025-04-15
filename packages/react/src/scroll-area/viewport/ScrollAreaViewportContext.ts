import * as React from 'react';

export interface ScrollAreaViewportContext {
  computeThumbPosition: () => void;
}

export const ScrollAreaViewportContext = React.createContext<ScrollAreaViewportContext | undefined>(
  undefined,
);

if (process.env.NODE_ENV !== 'production') {
  ScrollAreaViewportContext.displayName = 'ScrollAreaViewportContext';
}

export function useScrollAreaViewportContext() {
  const context = React.useContext(ScrollAreaViewportContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ScrollAreaViewportContext missing. ScrollAreaViewport parts must be placed within <ScrollArea.Viewport>.',
    );
  }
  return context;
}
