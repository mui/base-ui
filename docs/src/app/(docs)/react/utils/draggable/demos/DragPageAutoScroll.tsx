'use client';
import * as React from 'react';
import { Draggable } from '@base-ui/react/draggable';

/** Keep page-edge scrolling explicit in examples that also contain local viewports. */
export function DragPageAutoScroll() {
  const manager = Draggable.useDragDropManager();
  React.useEffect(
    () => manager.registerAutoScroller(document.documentElement, () => ({})),
    [manager],
  );
  return null;
}
