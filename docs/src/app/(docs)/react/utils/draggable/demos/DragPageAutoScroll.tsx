'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';

/**
 * Auto-scrolls the docs page while one of this example's items is dragged.
 *
 * The page can't be a `Draggable.Viewport` because that component renders its
 * own element, so this registers `document.documentElement` imperatively.
 *
 * The registration lives only as long as a drag this example accepts. Several
 * examples share the docs page, and only the latest registration on an element
 * applies, so a permanent one would override the other examples. An app with a
 * single list can register the page once in an effect instead.
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
