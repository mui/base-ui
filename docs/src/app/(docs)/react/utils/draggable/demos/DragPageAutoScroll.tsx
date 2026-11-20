'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';

/**
 * Auto-scrolls the docs page while one of this example's items is dragged.
 * The page is registered imperatively because `Draggable.Viewport` renders its own element.
 * Only the latest registration on an element applies and several examples share this page,
 * so each registration lasts one drag. A single-list app can register once in an effect.
 */
export function DragPageAutoScroll({
  accept,
}: {
  accept: NonNullable<Draggable.Viewport.Props['accept']>;
}) {
  const manager = Draggable.useManager();
  const unregister = React.useRef<(() => void) | null>(null);
  const cleanup = useStableCallback(() => {
    unregister.current?.();
    unregister.current = null;
  });
  Draggable.useMonitor({
    accept,
    onMoveStart: (eventDetails) => {
      cleanup();
      unregister.current = manager.registerViewport(
        ownerDocument(eventDetails.source.element).documentElement,
        () => ({ accept }),
      );
    },
    onMoveEnd: cleanup,
  });
  React.useEffect(() => cleanup, [cleanup]);
  return null;
}
