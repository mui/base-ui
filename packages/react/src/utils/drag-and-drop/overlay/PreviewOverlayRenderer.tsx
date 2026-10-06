'use client';
import type * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { dragPreviewStore } from './dragPreviewStore';
import type { DragPreviewState } from './dragPreviewStore';
import { useDraggableContext } from '../../../draggable/DraggableContext';
import type { DraggableContextValue } from '../../../draggable/DraggableContext';

// Module-level, so its identity is stable for `useStore`'s selector fast path. The
// provider context is passed as an argument and matches only previews published
// from its subtree.
function selectPreviewState(
  state: DragPreviewState | null,
  context: DraggableContextValue,
): DragPreviewState | null {
  return state?.context === context ? state : null;
}

/**
 * Renders the content a `Draggable.Preview` declared for the active drag.
 *
 * The content renders into a detached element, never into the document. The engine
 * copies it once into the preview element it inserted beside the drag source (or into
 * the configured `container`), the same way it clones a source. Later renders reach
 * the copy through `Draggable.updatePreview()`. The copy is engine-owned, which lets
 * the preview outlive a source that a virtualizer unmounts mid-drag, or the provider
 * itself.
 *
 * Renders only previews published through its own `Draggable.Provider`, so the
 * content stays in that React tree while the drag itself is global.
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
