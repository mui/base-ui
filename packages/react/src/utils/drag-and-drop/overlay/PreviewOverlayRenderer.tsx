'use client';
import type * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { dragPreviewStore } from './dragPreviewStore';
import type { DragPreviewState } from './dragPreviewStore';
import { useDraggableContext } from '../../../draggable/DraggableContext';
import type { DraggableContextValue } from '../../../draggable/DraggableContext';

// Module-level, so its identity is stable for `useStore`'s selector fast path.
function selectPreviewState(
  state: DragPreviewState | null,
  context: DraggableContextValue,
): DragPreviewState | null {
  return state?.context === context ? state : null;
}

/**
 * Renders the active drag's `Draggable.Preview` content (see `DragPreviewState`) when
 * this `Draggable.Provider` published it, so it stays in that React tree although the
 * store is global. The engine owns the copy it makes, so the preview outlives a source
 * or provider that unmounts mid-drag.
 */
export function PreviewOverlayRenderer(): React.ReactNode {
  const previewContext = useDraggableContext();
  const preview = useStore(dragPreviewStore, selectPreviewState, previewContext);

  // Copy the content once it is committed, before paint.
  useIsoLayoutEffect(() => {
    preview?.sync();
  });

  if (!preview) {
    return null;
  }
  // The portal keeps the content in this React tree, so it reads the context
  // around the `Draggable.Provider`.
  return ReactDOM.createPortal(preview.node, preview.container);
}
