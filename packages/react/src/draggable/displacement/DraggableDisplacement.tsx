'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { DragCleanupFn } from '../../types/drag';
import {
  scheduleDisplacementSweep,
  trackDisplacedElement,
} from '../../utils/drag-and-drop/displacement';
import { useDraggableRootContext } from '../root/DraggableRootContext';

/**
 * Enables layout-displacement tracking for its parent `Draggable.Root`.
 * Renders no element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/components/draggable)
 */
export function DraggableDisplacement(): null {
  const { observeElement } = useDraggableRootContext();
  const elementRef = React.useRef<HTMLElement | null>(null);
  const trackingCleanupRef = React.useRef<DragCleanupFn | null>(null);

  useIsoLayoutEffect(() => {
    const stopObserving = observeElement((element) => {
      trackingCleanupRef.current?.();
      trackingCleanupRef.current = null;
      elementRef.current = element;
      if (element) {
        trackingCleanupRef.current = trackDisplacedElement(element);
      }
    });
    return () => {
      stopObserving();
      trackingCleanupRef.current?.();
      trackingCleanupRef.current = null;
    };
  }, [observeElement]);

  // Dependency-less on purpose: any tracked sibling that re-renders requests
  // the per-commit sweep, and the first request measures the whole registry, so
  // a memoized row that moved without re-rendering is still seen.
  useIsoLayoutEffect(() => {
    scheduleDisplacementSweep(elementRef.current ?? undefined);
  });

  return null;
}
