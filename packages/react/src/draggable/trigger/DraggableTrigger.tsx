'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import { useDraggableRootContext } from '../root/DraggableRootContext';

const stateAttributesMapping: StateAttributesMapping<DraggableTriggerState> = {
  // The engine sets `data-dragging` at pickup, once it has measured the element, so
  // `[data-dragging]` rules apply before React renders.
  dragging: () => null,
  // The engine sets `data-settling` too, in step with the preview it settles.
  settling: () => null,
};

/**
 * The element the user picks up and drops on a matching drop target.
 * An empty `<Draggable.Preview>` renders it again to show it under the pointer.
 * Render one per `<Draggable.Root>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export const DraggableTrigger = React.forwardRef(function DraggableTrigger(
  componentProps: DraggableTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, ...elementProps } = componentProps;
  const context = useDraggableRootContext();

  // An empty `Draggable.Preview` renders these props again. It reads them when a drag
  // starts, so the write notifies nothing.
  useIsoLayoutEffect(() => {
    context.triggerProps.current = componentProps;
  });

  const state: DraggableTrigger.State = {
    dragging: context.drag.phase === 'dragging',
    settling: context.drag.phase === 'settling',
    disabled: context.disabled,
  };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, context.triggerRef],
    props: elementProps,
    stateAttributesMapping,
  });
});

export interface DraggableTriggerState {
  /**
   * Whether this element is being dragged.
   */
  dragging: boolean;
  /**
   * Whether this element's preview is still running its ending animation after the drop.
   * The element keeps `[data-dragging]` until then, so `dragging || settling`
   * matches that attribute.
   */
  settling: boolean;
  /**
   * Whether the draggable is disabled.
   */
  disabled: boolean;
}

export interface DraggableTriggerProps extends Omit<
  BaseUIComponentProps<'div', DraggableTriggerState>,
  // `draggable` would start native dragging alongside the pointer sensor.
  'draggable'
> {}

export namespace DraggableTrigger {
  export type State = DraggableTriggerState;
  export type Props = DraggableTriggerProps;
}
