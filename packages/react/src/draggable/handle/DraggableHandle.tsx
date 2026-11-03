'use client';
import * as React from 'react';
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

  // Attaching or detaching a handle refreshes its root's gesture setup.
  // `useRegistrationRef` ignores the detach and re-attach an inline `ref` causes on every render.
  const handleRef = useRegistrationRef<HTMLElement>(context.registerHandle);

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
 * `registerSource`: an element, a ref to one, or a function that returns one.
 * A `null` handle makes the whole draggable its own handle.
 */
export type DraggableHandleReference =
  Element | { current: Element | null } | (() => Element | null | undefined);

export namespace DraggableHandle {
  export type Reference = DraggableHandleReference;
  export type State = DraggableHandleState;
  export type Props = DraggableHandleProps;
}
