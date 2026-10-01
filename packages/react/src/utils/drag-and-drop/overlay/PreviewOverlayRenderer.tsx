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
 * copies it into the preview element it inserted beside the drag source (or into
 * the configured `container`), the same way it clones a source. It keeps that copy
 * in step with every later commit, so components in the content can keep state and
 * subscribe to the drag. The copy is engine-owned, which lets the preview outlive
 * a source that a virtualizer unmounts mid-drag.
 *
 * Renders only previews published through its own `Draggable.Provider`, so the
 * content stays in that React tree while the drag itself is global.
 */
export function PreviewOverlayRenderer(): React.ReactNode {
  const previewContext = useDraggableContext();
  const preview = useStore(dragPreviewStore, selectPreviewState, previewContext);

  // Copy the content as soon as it is committed. The engine would otherwise pick it
  // up in a microtask, which is still before paint but after the commit returns.
  useIsoLayoutEffect(() => {
    preview?.sync();
  });

  // A provider that unmounts mid-drag takes the content with it. This cleanup runs
  // before React removes the portal's children, so the preview keeps its last
  // content until the drag ends instead of emptying. The container is the same
  // for every render of one drag, so a `renderPreview()` doesn't trigger it.
  const container = preview?.container;
  const freeze = preview?.freeze;
  useIsoLayoutEffect(() => () => freeze?.(), [container, freeze]);

  if (!preview) {
    return null;
  }
  // The portal keeps the content in this React tree, so it reads the context
  // around the `Draggable.Provider`.
  return ReactDOM.createPortal(preview.node, preview.container);
}
