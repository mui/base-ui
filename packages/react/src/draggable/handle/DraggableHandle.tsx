'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';
import { useDraggableRootContext } from '../root/DraggableRootContext';

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
  const { className, render, style, ...elementProps } = componentProps;
  const context = useDraggableRootContext();

  const token = useRefWithInit(() => ({})).current;
  // Attaching or detaching a handle re-registers its root. `useRegistrationRef`
  // ignores the detach and re-attach an inline `ref` causes on every render.
  const handleRef = useRegistrationRef<HTMLElement>((node) => {
    context.setHandleElement(node, token);
    return () => context.setHandleElement(null, token);
  });

  return useRenderElement('span', componentProps, {
    state: { disabled: context.disabled },
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

export interface DraggableHandleProps extends BaseUIComponentProps<'span', DraggableHandleState> {}

/**
 * The element that must be pressed to start a drag, for the `handle` option of
 * `registerSource`. `<Draggable.Root>` uses `<Draggable.Handle>` instead.
 *
 * - `Element`: This element.
 * - `RefObject`: The element the ref points to.
 * - `function`: Returns the handle, or `null` to make the whole draggable its own handle.
 */
export type DraggableHandleReference =
  Element | { current: Element | null } | (() => Element | null | undefined);

export namespace DraggableHandle {
  export type Reference = DraggableHandleReference;
  export type State = DraggableHandleState;
  export type Props = DraggableHandleProps;
}
