'use client';
import * as React from 'react';
import type { DragPreview } from '../../utils/drag-and-drop/synthetic/syntheticPreview';
import type { DraggableTriggerProps } from '../trigger/DraggableTrigger';

export interface DraggableRootContext {
  /** See `UseDraggableElementReturnValue.registerHandle`. Stable. */
  registerHandle: (node: HTMLElement) => () => void;
  /** The preview of the trigger's drag, active or settling, or `null`. Stable. */
  getPreview: () => DragPreview | null;
  /**
   * The trigger's committed props, which an empty `Draggable.Preview` renders again. Not a
   * store: the preview reads them once per drag, so a trigger that renders again doesn't
   * render it again in a second commit. Stable.
   */
  triggerProps: { current: DraggableTriggerProps | null };
  /** Registers the element `Draggable.Trigger` renders as the drag source. Stable. */
  triggerRef: (node: HTMLElement | null) => void;
  /** Whether the source is being dragged. */
  dragging: boolean;
  /** Whether the source's preview is still running its ending animation after the drop. */
  settling: boolean;
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
