'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';

/** Register the page only while this example owns the drag. */
export function DragPageAutoScroll({
  accept,
}: {
  accept: NonNullable<Draggable.Viewport.Props['accept']>;
}) {
  const manager = Draggable.useDragDropManager();
  const unregister = React.useRef<(() => void) | null>(null);
  const cleanup = useStableCallback(() => {
    unregister.current?.();
    unregister.current = null;
  });
  Draggable.useDragMonitor({
    accept,
    onMoveStart: ({ source }) => {
      cleanup();
      unregister.current = manager.registerAutoScroller(
        ownerDocument(source.element).documentElement,
        () => ({ accept }),
      );
    },
    onMoveEnd: cleanup,
  });
  React.useEffect(() => cleanup, [cleanup]);
  return null;
}
