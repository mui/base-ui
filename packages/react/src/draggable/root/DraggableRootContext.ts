'use client';
import * as React from 'react';
import type { DragPreviewHandle } from '../../utils/drag-and-drop/dragPreviewDeclaration';
import type { DraggableContextValue } from '../DraggableContext';

export interface DraggableRootContext<TPayload = unknown, TDragData = unknown> {
  /**
   * Attach or detach a drag handle. Re-registers the draggable so the static
   * gesture setup follows a handle that mounts later. Stable.
   *
   * `token` identifies the calling handle across its attach (`node`) and detach
   * (`null`) calls. React passes only `null` on detach, and the node is still in
   * the document then, so the token is the only way to tell which handle left.
   */
  setHandleElement: (node: HTMLElement | null, token: object) => void;
  /** The link a `Draggable.Preview` declares into. Stable. */
  previewHandle: DragPreviewHandle<TPayload, TDragData>;
  /**
   * The `Draggable.Provider` seen from the root. The engine publishes preview
   * content through it. A `Draggable.Preview` compares it against its own nearest
   * provider and throws at render when a provider is mounted inside the root.
   */
  previewContext: DraggableContextValue;
  /**
   * The root's `disabled`, so the handle can set `data-disabled`. The engine
   * refuses the pickup either way. The attribute lets the handle be styled as
   * inert along with its root.
   */
  disabled: boolean;
}

// Every root shares this context, so it erases the payload type. A
// `Draggable.Root<CardPayload>` and its parts agree on `TPayload`, and
// `useDraggableRootContext<TPayload, TDragData>()` restores it for the parts.
export const DraggableRootContext = React.createContext<DraggableRootContext<any, any> | undefined>(
  undefined,
);

export function useDraggableRootContext<
  TPayload = unknown,
  TDragData = unknown,
>(): DraggableRootContext<TPayload, TDragData> {
  const context = React.useContext(DraggableRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: DraggableRootContext is missing. A <Draggable.Handle> or <Draggable.Preview> is ' +
        'rendered outside of <Draggable.Root>, so it has no draggable to configure. ' +
        'Place it within the <Draggable.Root> it belongs to. ' +
        'See https://base-ui.com/react/utils/draggable.',
    );
  }
  return context;
}
