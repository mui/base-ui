'use client';
import type * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { dragPreviewStore } from './dragPreviewStore';
import type { DragPreviewState } from './dragPreviewStore';
import { useDraggableContext } from '../../../draggable/DraggableContext';
import type { DraggableContextValue } from '../../../draggable/DraggableContext';
import { getActivePreviewHandle } from '../activePreview';
import { resolveDragPreviewOffset } from '../synthetic/pickupPreview';

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
 * Fills the active drag's preview host with the content a `Draggable.Preview` declared.
 *
 * The host is an engine-owned element, inserted next to the drag source (or into
 * the configured container) and moved each frame to follow the pointer. The
 * default clone gets the same treatment, so a custom preview picks up the app's CSS
 * the same way. React only portals content into it, which lets the preview outlive
 * a source that a virtualizer unmounts mid-drag.
 *
 * Renders only previews published through its own `Draggable.Provider`, so the
 * content stays in that React tree while the drag itself is global.
 */
export function PreviewOverlayRenderer(): React.ReactNode {
  const previewContext = useDraggableContext();
  const preview = useStore(dragPreviewStore, selectPreviewState, previewContext);

  useIsoLayoutEffect(() => {
    // Only an offset callback depends on the preview's rendered size, which the
    // host has now that the content is in it. The engine already resolved every
    // other form from the source rect when it placed the host.
    if (!preview || typeof preview.offset !== 'function') {
      return;
    }
    getActivePreviewHandle()?.setPreviewOffset(
      resolveDragPreviewOffset(preview.offset, {
        container: preview.host,
        sourceRect: preview.sourceRect,
        input: preview.input,
      }),
    );
  }, [preview]);

  if (!preview) {
    return null;
  }
  // The portal keeps the content in this React tree, so it reads the context
  // around the `Draggable.Provider`. Its DOM node sits next to the drag source,
  // where the app's CSS applies.
  return ReactDOM.createPortal(preview.node, preview.host);
}
