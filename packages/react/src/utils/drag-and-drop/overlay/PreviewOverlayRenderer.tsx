'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { dragPreviewStore, type DragPreviewState } from './dragPreviewStore';
import type { DragPreviewContext } from './DragPreviewContext';
import { setActivePreviewOffset } from '../activePreview';
import { resolveDragPreviewOffset } from '../customDragPreview';

// Stable identity so `useStore`'s selector fast path holds. The provider context
// is passed separately and selects only the preview published from its subtree.
function selectPreviewState(
  state: DragPreviewState | null,
  context: DragPreviewContext,
): DragPreviewState | null {
  return state?.context === context ? state : null;
}

/**
 * Fills the active drag's preview host with the content a `Draggable.Preview` declared.
 *
 * The host is an engine-owned element, injected next to the drag source (or into
 * the configured container) and transformed each frame to follow the pointer — the
 * same treatment the default clone gets, so a custom preview inherits the app's CSS
 * the same way. React only portals content into it, which is what lets the preview
 * outlive a source the virtualizer unmounts mid-drag.
 *
 * Selects previews published by its `Draggable.PreviewProvider`, so the content
 * renders in the same React tree while the drag itself stays global.
 */
export function PreviewOverlayRenderer(props: {
  previewContext: DragPreviewContext;
}): React.ReactNode {
  const { previewContext } = props;
  const preview = useStore(dragPreviewStore, selectPreviewState, previewContext);

  // Works for pointer and keyboard drags alike (both publish a preview host).
  const active = preview != null;

  useIsoLayoutEffect(() => {
    if (!active) {
      return;
    }
    // Only an offset *callback* depends on the preview's rendered size, which the
    // host only has now that the content is in it. Every other form was already
    // resolved from the source rect when the engine placed the host, so re-running
    // it here would be a no-op.
    if (typeof preview.offset !== 'function') {
      return;
    }
    setActivePreviewOffset(
      resolveDragPreviewOffset(preview.offset, {
        container: preview.host,
        sourceRect: preview.sourceRect,
        input: preview.input,
      }),
    );
  }, [active, preview]);

  if (!active) {
    return null;
  }
  // The portal keeps the content in this React tree — so it inherits the context
  // around the `Draggable.PreviewProvider` — while the DOM node it lands in sits next
  // to the drag source, where the app's CSS applies to it.
  return ReactDOM.createPortal(preview.node, preview.host);
}
