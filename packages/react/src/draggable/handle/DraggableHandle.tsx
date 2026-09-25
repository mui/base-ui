'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { warn } from '@base-ui/utils/warn';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useDraggableRootContext } from '../root/DraggableRootContext';
import type { DraggableHandleReference } from '../../types/drag';

/**
 * The area of a draggable that starts a drag. The rest of the draggable stays interactive.
 * Omit it to make the whole draggable start a drag.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export const DraggableHandle = React.forwardRef(function DraggableHandle(
  componentProps: DraggableHandle.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, style, disabled: disabledProp, ...elementProps } = componentProps;
  const { setHandleElement, disabled } = useDraggableRootContext();

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && disabledProp !== undefined) {
      warn(
        '`disabled` was passed to Draggable.Handle, which has no disabled state of its own. ' +
          'The engine reads `disabled` from Draggable.Root, so the handle would look disabled while the root stayed draggable. ' +
          'Set `disabled` on Draggable.Root instead.',
      );
    }
  }, [disabledProp]);

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
   * Not supported. A handle follows the disabled state of its `<Draggable.Root>`.
   */
  disabled?: never | undefined;
}

export type { DraggableHandleReference } from '../../types/drag';

export namespace DraggableHandle {
  export type Reference = DraggableHandleReference;
  export type State = DraggableHandleState;
  export type Props = DraggableHandleProps;
}
