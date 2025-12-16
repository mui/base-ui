import * as React from 'react';
import type { ScrollAreaRoot } from './ScrollAreaRoot';

export interface ScrollAreaRootContext {
  cornerSize: { width: number; height: number };
  setCornerSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  thumbSize: { width: number; height: number };
  setThumbSize: React.Dispatch<React.SetStateAction<{ width: number; height: number }>>;
  touchModality: boolean;
  hovering: boolean;
  setHovering: React.Dispatch<React.SetStateAction<boolean>>;
  scrollingX: boolean;
  setScrollingX: React.Dispatch<React.SetStateAction<boolean>>;
  scrollingY: boolean;
  setScrollingY: React.Dispatch<React.SetStateAction<boolean>>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  rootRef: React.RefObject<HTMLDivElement | null>;
  scrollbarYRef: React.RefObject<HTMLDivElement | null>;
  thumbYRef: React.RefObject<HTMLDivElement | null>;
  scrollbarXRef: React.RefObject<HTMLDivElement | null>;
  thumbXRef: React.RefObject<HTMLDivElement | null>;
  cornerRef: React.RefObject<HTMLDivElement | null>;
  handlePointerDown: (event: React.PointerEvent) => void;
  handlePointerMove: (event: React.PointerEvent) => void;
  handlePointerUp: (event: React.PointerEvent) => void;
  handleScroll: (scrollPosition: { x: number; y: number }) => void;
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
  overflowEdges: {
    xStart: boolean;
    xEnd: boolean;
    yStart: boolean;
    yEnd: boolean;
  };
  setOverflowEdges: React.Dispatch<
    React.SetStateAction<{
      xStart: boolean;
      xEnd: boolean;
      yStart: boolean;
      yEnd: boolean;
    }>
  >;
  viewportState: ScrollAreaRoot.State;
  overflowEdgeThreshold: {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
  };
}

export const ScrollAreaRootContext = React.createContext<ScrollAreaRootContext | undefined>(
  undefined,
);

export function useScrollAreaRootContext() {
  const context = React.useContext(ScrollAreaRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: ScrollAreaRootContext is missing. ScrollArea parts must be placed within <ScrollArea.Root>.',
    );
  }
  return context;
}
