'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useDraggableHandle } from '../handle/useDraggableHandle';

/**
 * Restricts keyboard drag pickup to this button while leaving the whole source
 * draggable with the pointer.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/components/draggable)
 */
export const DraggableKeyboardHandle = React.forwardRef(function DraggableKeyboardHandle(
  componentProps: DraggableKeyboardHandle.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return useDraggableHandle(componentProps, forwardedRef, true);
});

export interface DraggableKeyboardHandleState {
  /** Whether the draggable is disabled. */
  disabled: boolean;
}

export interface DraggableKeyboardHandleProps
  extends
    Omit<BaseUIComponentProps<'button', DraggableKeyboardHandleState>, 'disabled'>,
    Omit<NativeButtonProps, 'disabled'> {
  /**
   * A handle has no independent disabled state. Set `disabled` on
   * `Draggable.Root` instead.
   */
  disabled?: never | undefined;
}

export namespace DraggableKeyboardHandle {
  export type State = DraggableKeyboardHandleState;
  export type Props = DraggableKeyboardHandleProps;
}
