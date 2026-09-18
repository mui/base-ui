'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  NativeDragEventProps,
  RegisterAutoScrollerParameters,
  DragParametersWithInferredAccept,
} from '../../types/dragRegistration';
import type { AcceptedDragPayload, AnyDragAccept, DragKind } from '../../types/drag';
import { useDraggableViewportElement } from './useDraggableViewportElement';
import type { UseDraggableViewportElementParameters } from './useDraggableViewportElement';

/**
 * Registers its element as a drag auto-scroll viewport.
 * Nested containers and the page need their own registrations to scroll.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export const DraggableViewport = React.forwardRef(function DraggableViewport<TSourceData = unknown>(
  componentProps: DraggableViewportProps<TSourceData>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    // Rendering props
    className,
    render,
    style,
    children,
    // Auto-scroll props. Listed explicitly because whatever stays in
    // `elementProps` is spread onto the `<div>`, where an engine parameter would
    // land as an attribute.
    accept,
    onDragScroll,
    disabled,
    maxSpeed,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  // A fresh object per render is fine: `useDraggableViewportElement` reads it
  // through a ref and never compares it.
  const params: UseDraggableViewportElementParameters<TSourceData> = {
    accept,
    onDragScroll,
    disabled,
    maxSpeed,
  };

  const { ref } = useDraggableViewportElement<TSourceData>(params);

  const state: DraggableViewport.State = { disabled: disabled ?? false };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: [{ children }, elementProps],
  });
  // `React.forwardRef` erases the payload type argument, so the generic signature
  // is restored by hand.
}) as {
  <TSourceData = unknown>(
    props: DraggableViewportProps<TSourceData> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
  // Private inference overload for heterogeneous `accept` arrays. Explicit
  // component generics use the payload-keyed overload above.
  <TAccept extends AnyDragAccept = DragKind<unknown>>(
    props: DragParametersWithInferredAccept<
      DraggableViewportProps<AcceptedDragPayload<TAccept>>,
      TAccept
    > &
      React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

export interface DraggableViewportState {
  /** Whether auto-scrolling is disabled. */
  disabled: boolean;
}

// `disabled` is not redeclared here: an intersection member's JSDoc never reaches
// the generated reference, so the description would ship nowhere. It lives on
// `RegisterAutoScrollerParameters` instead, which this inherits.
export type DraggableViewportProps<TSourceData = unknown> = Omit<
  BaseUIComponentProps<'div', DraggableViewportState>,
  // The whole native HTML5 drag event family is replaced by this engine, as on
  // `Draggable.Root` and `Draggable.Target`.
  NativeDragEventProps
> &
  RegisterAutoScrollerParameters<TSourceData>;

export namespace DraggableViewport {
  export type State = DraggableViewportState;
  export type Props<TSourceData = unknown> = DraggableViewportProps<TSourceData>;
}
