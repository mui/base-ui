'use client';
import * as React from 'react';
import type { DragPreviewHandle } from '../preview/dragPreviewDeclaration';
import type { DraggableContextValue } from '../DraggableContext';

export interface DraggableRootContext<TPayload = unknown, TDragData = unknown> {
  /** See `UseDraggableElementReturnValue.registerHandle`. Stable. */
  registerHandle: (node: HTMLElement) => () => void;
  /** The link a `Draggable.Preview` declares into. Stable. */
  previewHandle: DragPreviewHandle<TPayload, TDragData>;
  /** The `Draggable.Provider` seen from the root, whose overlay renders custom preview content. */
  previewContext: DraggableContextValue;
  /**
   * The root's `disabled`, so the handle can set `data-disabled` for styling. The
   * engine refuses the pickup either way.
   */
  disabled: boolean;
}

// Shared by every root, so the payload type is erased here and restored by
// `useDraggableRootContext<TPayload, TDragData>()`.
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
