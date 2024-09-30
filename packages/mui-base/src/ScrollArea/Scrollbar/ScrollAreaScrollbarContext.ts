import * as React from 'react';

export interface ScrollAreaScrollbarContext {
  orientation: 'horizontal' | 'vertical';
}

export const ScrollAreaScrollbarContext = React.createContext<ScrollAreaScrollbarContext | null>(
  null,
);

if (process.env.NODE_ENV !== 'production') {
  ScrollAreaScrollbarContext.displayName = 'ScrollAreaScrollbarContext';
}

export function useScrollAreaScrollbarContext() {
  const context = React.useContext(ScrollAreaScrollbarContext);
  if (context === null) {
    throw new Error('Base UI: ScrollAreaScrollbarContext is undefined.');
  }
  return context;
}
