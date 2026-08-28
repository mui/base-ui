'use client';
import * as React from 'react';
import type { DragPreviewHandle } from '../../utils/drag-and-drop/dragPreviewDeclaration';
import type { DragPreviewContext } from '../../utils/drag-and-drop/overlay/DragPreviewContext';

export interface DraggableRootContext<TData = unknown> {
  /**
   * Attach or detach a drag handle. Re-registers the draggable so the static
   * gesture setup follows a handle that mounts later. Stable.
   *
   * `token` identifies the calling handle across its attach (`node`) and detach
   * (`null`) calls — React passes no identity with the `null`, and the node is
   * still in the document at that point, so nothing else distinguishes which of
   * several handles just left.
   */
  setHandleElement: (node: HTMLElement | null, token: object) => void;
  /** The link a `Draggable.Preview` declares into. Stable. */
  previewHandle: DragPreviewHandle<TData>;
  /**
   * The `Draggable.PreviewProvider` visible from the root's own position — the
   * one the engine publishes preview content through. A `Draggable.Preview`
   * compares it against its nearest provider to fail at render, rather than at
   * drag start, when a provider is mounted inside the root.
   */
  previewContext: DragPreviewContext | null;
  /**
   * The root's `disabled`, so the handle drops out of the tab order along with
   * it — the engine refuses the pickup either way, but a focusable button that
   * does nothing would still be announced as an affordance.
   */
  disabled: boolean;
}

// The payload type is erased on the context: a `Draggable.Root<CardPayload>` and
// its parts agree on `TData`, but the context itself is shared by every root.
// `useDraggableRootContext<TData>()` restores it for the parts.
export const DraggableRootContext = React.createContext<DraggableRootContext<any> | undefined>(
  undefined,
);

export function throwMissingDraggableRootContext(): never {
  throw new Error(
    'Base UI: DraggableRootContext is missing. This means a <Draggable.*> part is rendered ' +
      'outside of <Draggable.Root>, so it cannot reach the draggable it configures and would crash. ' +
      'Place all Draggable parts within <Draggable.Root />. ' +
      'See https://base-ui.com/react/components/draggable.',
  );
}

export function useDraggableRootContext<TData = unknown>(): DraggableRootContext<TData>;
export function useDraggableRootContext<TData = unknown>(
  optional: true,
): DraggableRootContext<TData> | undefined;
export function useDraggableRootContext<TData = unknown>(
  optional = false,
): DraggableRootContext<TData> | undefined {
  const context = React.useContext(DraggableRootContext);
  if (context === undefined && !optional) {
    throwMissingDraggableRootContext();
  }
  return context;
}
