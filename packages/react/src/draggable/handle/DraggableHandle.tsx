'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { warn } from '@base-ui/utils/warn';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useDraggableRootContext } from '../root/DraggableRootContext';

/**
 * Restricts the drag pickup to this element, leaving the rest of the source
 * interactive. Omit it to make the whole source draggable.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/components/draggable)
 */
export const DraggableHandle = React.forwardRef(function DraggableHandle(
  componentProps: DraggableHandle.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, style, disabled: disabledProp, ...elementProps } = componentProps;
  const { setHandleElement, disabled } = useDraggableRootContext();

  if (process.env.NODE_ENV !== 'production' && disabledProp !== undefined) {
    warn(
      'Base UI: `disabled` was passed to Draggable.Handle, which has no disabled state of its own. ' +
        'The engine reads `disabled` from Draggable.Root, so the handle would look disabled while the root stayed draggable. ' +
        'Set `disabled` on Draggable.Root instead.',
    );
  }

  const handleRef = useRefWithInit(() => {
    const token = {};
    return (node: HTMLElement | null) => setHandleElement(node, token);
  }).current;

  return useRenderElement('span', componentProps, {
    state: { disabled },
    props: [elementProps],
    ref: [forwardedRef, handleRef],
  });
});

export interface DraggableHandleState {
  /**
   * Whether the draggable is disabled.
   */
  disabled: boolean;
}

export interface DraggableHandleProps extends Omit<
  BaseUIComponentProps<'span', DraggableHandleState>,
  'disabled'
> {
  /**
   * A handle has no independent disabled state. Setting `disabled` here would
   * leave the root draggable. Set `disabled` on `Draggable.Root` instead.
   *
   * This prop is typed as `never` so passing it causes a type error.
   */
  disabled?: never | undefined;
}

export namespace DraggableHandle {
  export type State = DraggableHandleState;
  export type Props = DraggableHandleProps;
}
