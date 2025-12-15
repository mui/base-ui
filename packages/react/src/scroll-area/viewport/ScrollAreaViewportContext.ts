import * as React from 'react';
import { useContext } from '@base-ui/utils/useContext';

export interface ScrollAreaViewportContext {
  computeThumbPosition: () => void;
}

export const ScrollAreaViewportContext = React.createContext<ScrollAreaViewportContext | undefined>(
  undefined,
);

export function useScrollAreaViewportContext() {
  const context = useContext(ScrollAreaViewportContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ScrollAreaViewportContext missing. ScrollAreaViewport parts must be placed within <ScrollArea.Viewport>.',
    );
  }
  return context;
}
