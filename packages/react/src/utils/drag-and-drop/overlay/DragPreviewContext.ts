'use client';
import * as React from 'react';
import type { Store } from '@base-ui/utils/store';
import type { DragPreviewContainer } from '../../../types/drag';
import type { DragPreviewState } from './dragPreviewStore';
import type { LatestRef } from '../useRegistrationRef';

/** Store of the active drag's preview content for one provider. */
export type DragPreviewStore = Store<DragPreviewState | null>;

export interface DragPreviewContext {
  /** The store this provider's overlay renders the active drag's preview content from. */
  previewStore: DragPreviewStore;
  /**
   * Subtree default for `container`; a preview's own `container` wins over it.
   * A ref (read at drag start) so the provider's context value keeps a stable
   * identity when an inline `container` callback changes identity every render.
   */
  containerRef: LatestRef<DragPreviewContainer | undefined>;
}

/**
 * The nearest `Draggable.PreviewProvider`, or `null` when there is none.
 *
 * The drag engine is global — draggables, drop targets, monitors, auto-scrollers
 * and the default clone all work with no provider at all. The React layer is not:
 * a preview with content has to render in a React tree, so a `Draggable.Preview`
 * (or an imperative `dragPreview.render`) needs a provider and throws without one.
 */
export const DragPreviewContext = React.createContext<DragPreviewContext | null>(null);

/**
 * Read the nearest `Draggable.PreviewProvider`. Returns `null` when none wraps the
 * caller — the callers that need one throw with their own message, since only they
 * know whether this drag renders content or just clones the source.
 */
export function useDragPreviewContext(): DragPreviewContext | null {
  return React.useContext(DragPreviewContext);
}
