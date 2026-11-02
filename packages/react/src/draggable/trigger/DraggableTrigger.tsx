'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import type { BaseUIComponentProps } from '../../internals/types';
import { useDraggableRootContext } from '../root/DraggableRootContext';

const stateAttributesMapping: StateAttributesMapping<DraggableTriggerState> = {
  // The engine sets `data-dragging` after it builds and measures the preview, so the
  // clone never inherits it. Rendering it from React could land it before the clone.
  dragging: () => null,
  // The engine sets `data-settling` too, in step with the preview it settles.
  settling: () => null,
};

/**
 * The element the user picks up and drops on a matching drop target.
 * While dragging, a clone of the element follows the pointer by default.
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

  const state: DraggableTrigger.State = {
    dragging: context.dragging,
    settling: context.settling,
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
