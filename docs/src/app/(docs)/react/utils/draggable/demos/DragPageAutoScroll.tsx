'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Draggable } from '@base-ui/react/draggable';

/**
 * Auto-scrolls the docs page while one of this example's items is dragged.
 *
 * The page cannot be a `Draggable.Viewport` (that renders an element), so it is
 * registered imperatively on `document.documentElement`. The registration is
 * created when a drag this example accepts starts, and released when it ends,
 * rather than kept for the component's lifetime: several examples share the
 * docs page, and only the most recent registration on an element applies, so
 * a permanent one from another example would take precedence. Downloaded
 * examples include this file; an app with a single list can register the page
 * once in an effect instead.
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
    onMoveStart: ({ source }) => {
      cleanup();
      unregister.current = manager.registerViewport(
        ownerDocument(source.element).documentElement,
        () => ({ accept }),
      );
    },
    onMoveEnd: cleanup,
  });
  React.useEffect(() => cleanup, [cleanup]);
  return null;
}
