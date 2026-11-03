'use client';
import * as React from 'react';
import type { DragPreview, RootDrag } from '../../utils/drag-and-drop/synthetic/syntheticPreview';
import type { DraggableTriggerProps } from '../trigger/DraggableTrigger';
import { DraggablePositionerContext } from '../positioner/DraggablePositionerContext';

export interface DraggableRootContext {
  /** See `UseDraggableElementReturnValue.registerHandle`. Stable. */
  registerHandle: (node: HTMLElement) => () => void;
  /**
   * The trigger's committed props, which an empty `Draggable.Preview` renders again. Not a
   * store: the preview reads them once per drag, so a trigger that renders again doesn't
   * render it again in a second commit. Stable.
   */
  triggerProps: { current: DraggableTriggerProps | null };
  /** Registers the element `Draggable.Trigger` renders as the drag source. Stable. */
  triggerRef: (node: HTMLElement | null) => void;
  /**
   * The root's drag: whether it's dragging or settling after the drop, and its preview,
   * whose identity tells one drag from the next.
   */
  drag: RootDrag;
  /**
   * The root's `disabled`, so the trigger and handle can set `data-disabled` for styling.
   * The engine refuses the pickup either way.
   */
  disabled: boolean;
}

export const DraggableRootContext = React.createContext<DraggableRootContext | undefined>(
  undefined,
);

export function useDraggableRootContext(): DraggableRootContext {
  const context = React.useContext(DraggableRootContext);
  if (context === undefined) {
    throw new Error(
      'Base UI: DraggableRootContext is missing. A <Draggable.Trigger>, <Draggable.Handle>, ' +
        '<Draggable.Portal>, <Draggable.Positioner> or <Draggable.Preview> is rendered outside of ' +
        '<Draggable.Root>, so it has no draggable to configure. ' +
        'Place it within the <Draggable.Root> it belongs to. ' +
        'See https://base-ui.com/react/utils/draggable.',
    );
  }
  return context;
}

/**
 * The preview `Draggable.Portal` and `Draggable.Positioner` render: their root's, while it
 * is dragging or settling. `null` inside a preview, so a copy of the parts doesn't recurse.
 */
export function useRootPreview(): DragPreview | null {
  const rootContext = useDraggableRootContext();
  const inPreview = React.useContext(DraggablePositionerContext) !== undefined;
  return inPreview ? null : rootContext.drag.preview;
}
