'use client';
import * as React from 'react';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useDraggableHandle } from './useDraggableHandle';

/**
 * Restricts the drag pickup to this element, leaving the rest of the source
 * interactive. Omit it to make the whole source draggable.
 * Renders a `<button>` element.
 *
 * When the root has a `label` and the handle has no `aria-label`,
 * `aria-labelledby`, or visible text, Base UI creates a localized name from the
 * label. A handle with visible text keeps that text as its name. If it needs a
 * longer `aria-label`, start the label with the visible text. Base UI cannot
 * inspect content returned by a render function or custom component. Add an
 * explicit name when that content contains only an icon.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/components/draggable)
 */
export const DraggableHandle = React.forwardRef(function DraggableHandle(
  componentProps: DraggableHandle.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  return useDraggableHandle(componentProps, forwardedRef, false);
});

export interface DraggableHandleState {
  /**
   * Whether the draggable is disabled.
   */
  disabled: boolean;
}

export interface DraggableHandleProps
  extends
    Omit<BaseUIComponentProps<'button', DraggableHandleState>, 'disabled'>,
    Omit<NativeButtonProps, 'disabled'> {
  /**
   * A handle has no independent disabled state. Setting `disabled` here would
   * disable the button while leaving its root keyboard-draggable. Set `disabled`
   * on `Draggable.Root` instead.
   *
   * This prop is typed as `never` so passing it causes a type error.
   */
  disabled?: never | undefined;
}

export namespace DraggableHandle {
  export type State = DraggableHandleState;
  export type Props = DraggableHandleProps;
}
