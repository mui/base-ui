'use client';
import * as React from 'react';
import type {
  DragAutoScrollValue,
  DragAutoScrollEventDetails,
} from '../../utils/drag-and-drop/autoScroller';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  RegisterViewportParameters,
  DragParametersWithInferredAccept,
} from '../../types/dragRegistration';
import type {
  AcceptedDragPayload,
  AcceptedDragData,
  AnyDragAccept,
  DragKind,
} from '../../types/drag';
import { useDraggableViewportElement } from './useDraggableViewportElement';
import type { UseDraggableViewportElementParameters } from './useDraggableViewportElement';

/**
 * A scroll container that scrolls automatically when a drag nears its edges.
 * Each container, including nested ones, needs its own viewport.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export const DraggableViewport = React.forwardRef(function DraggableViewport<
  TSourcePayload = unknown,
  TDragData = unknown,
>(
  componentProps: DraggableViewportProps<TSourcePayload, TDragData>,
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
    overflowMargin,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  // A fresh object per render is fine: `useDraggableViewportElement` reads it
  // through a ref and never compares it.
  const params: UseDraggableViewportElementParameters<TSourcePayload, TDragData> = {
    accept,
    onDragScroll,
    disabled,
    maxSpeed,
    overflowMargin,
  };

  const { ref } = useDraggableViewportElement<TSourcePayload, TDragData>(params);

  const state: DraggableViewport.State = { disabled: disabled ?? false };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: [{ children }, elementProps],
  });
  // `React.forwardRef` erases the payload type argument, so the generic signature
  // is restored by hand.
}) as {
  <TSourcePayload = unknown, TDragData = unknown>(
    props: DraggableViewportProps<TSourcePayload, TDragData> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
  // Private inference overload for heterogeneous `accept` arrays. Explicit
  // component generics use the payload-keyed overload above.
  <TAccept extends AnyDragAccept = DragKind<unknown>>(
    props: DragParametersWithInferredAccept<
      DraggableViewportProps<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>,
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
// `RegisterViewportParameters` instead, which this inherits.
export type DraggableViewportProps<
  TSourcePayload = unknown,
  TDragData = unknown,
> = BaseUIComponentProps<'div', DraggableViewportState> &
  RegisterViewportParameters<TSourcePayload, TDragData>;

export type DraggableViewportDragScrollValue<
  TPayload = unknown,
  TDragData = unknown,
> = DragAutoScrollValue<TPayload, TDragData>;
export type DraggableViewportDragScrollEventDetails = DragAutoScrollEventDetails;
export type DraggableViewportDragScrollEventReason =
  DraggableViewportDragScrollEventDetails['reason'];

export namespace DraggableViewport {
  export type DragScrollValue<
    TPayload = unknown,
    TDragData = unknown,
  > = DraggableViewportDragScrollValue<TPayload, TDragData>;
  export type DragScrollEventDetails = DraggableViewportDragScrollEventDetails;
  export type DragScrollEventReason = DraggableViewportDragScrollEventReason;
  export type State = DraggableViewportState;
  export type Props<TSourcePayload = unknown, TDragData = unknown> = DraggableViewportProps<
    TSourcePayload,
    TDragData
  >;
}
