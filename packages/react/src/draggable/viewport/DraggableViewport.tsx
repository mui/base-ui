'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  RegisterViewportParameters,
  DragParametersWithInferredAccept,
} from '../../utils/drag-and-drop/registrationTypes';
import type { AcceptedDragPayload, AcceptedDragData } from '../../utils/drag-and-drop/types';
import type { DraggableAccept, DraggableKind, DraggableInput } from '../DraggableProvider';
import { useDraggableViewportElement } from './useDraggableViewportElement';
import type { UseDraggableViewportElementParameters } from './useDraggableViewportElement';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import type { DraggableRootRecord } from '../root/DraggableRoot';

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
    // Auto-scroll props, pulled out so they don't reach the `<div>` as
    // attributes through `elementProps`.
    accept,
    onDragScroll,
    disabled,
    maxSpeed,
    overflowMargin,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  // A new object each render is fine. `useDraggableViewportElement` reads it
  // through a stable getter and never compares the object itself.
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
    props: elementProps,
  });
  // `React.forwardRef` erases the payload type argument, so the generic signature
  // is restored by hand.
}) as {
  <TSourcePayload = unknown, TDragData = unknown>(
    props: DraggableViewportProps<TSourcePayload, TDragData> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
  // Private inference overload for heterogeneous `accept` arrays. Explicit
  // component generics use the payload-keyed overload above.
  <TAccept extends DraggableAccept<unknown> = DraggableKind<unknown, unknown>>(
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

// `disabled` isn't redeclared here because the API reference drops JSDoc on
// intersection members. Its description lives on `RegisterViewportParameters`,
// which this type inherits.
export type DraggableViewportProps<
  TSourcePayload = unknown,
  TDragData = unknown,
> = BaseUIComponentProps<'div', DraggableViewportState> &
  RegisterViewportParameters<TSourcePayload, TDragData>;

/**
 * Distances outside the container, in CSS pixels. Edges are physical and don't
 * follow text direction.
 */
export type DraggableViewportOverflowMargin =
  | number
  | {
      top?: number | undefined;
      right?: number | undefined;
      bottom?: number | undefined;
      left?: number | undefined;
    };

/** The argument of a viewport's `maxSpeed` function, called on every scrolling frame. */
export interface DraggableViewportMaxSpeedContext<TSourcePayload = unknown, TDragData = unknown> {
  /**
   * The position Base UI tested against the container's edges. It can differ
   * from the modified drag position when a modifier moves that position away
   * from the pointer.
   */
  input: DraggableInput;
  source: DraggableRootRecord<TSourcePayload, TDragData>;
  element: HTMLElement;
}

export type DraggableViewportDragScrollDirection = 'horizontal' | 'vertical';

/** The properties `onDragScroll`'s event details add to the Base UI change details. */
interface DraggableViewportDragScrollEventDetailsProperties<TSourcePayload, TDragData> {
  /** The item being dragged. */
  source: DraggableRootRecord<TSourcePayload, TDragData>;
  /**
   * How far to move horizontally this frame, in CSS pixels. It follows `scrollBy`,
   * so a positive value moves the view right and the content slides left.
   * Apply it as is, without multiplying by elapsed time.
   * Always `0` when `direction` is `'vertical'`.
   */
  x: number;
  /**
   * How far to move vertically this frame, in CSS pixels. A positive value moves the view down.
   * Always `0` when `direction` is `'horizontal'`.
   */
  y: number;
  /** The axis this call is about. `onDragScroll` is called once per engaged axis. */
  direction: DraggableViewportDragScrollDirection;
  /**
   * The position Base UI tested against the container's edges. It can differ
   * from the modified drag position when a modifier moves that position away
   * from the pointer.
   */
  input: DraggableInput;
  /** The scroll container. */
  element: HTMLElement;
  /**
   * Claims this axis so ancestor viewports don't scroll on it.
   * Don't call it at a bound the element can't move past, so an ancestor can scroll instead.
   */
  consume: () => void;
  /** Whether {@link consume} has been called. */
  isConsumed: boolean;
}

/**
 * The event details passed to `onDragScroll`.
 * Call `cancel()` to prevent Base UI from scrolling the container in this direction.
 * `event` is a placeholder, because the scroll loop runs on animation frames rather than native events.
 */
// An interface so the API reference prints its name instead of expanding it.
export interface DraggableViewportDragScrollEventDetails<
  TSourcePayload = unknown,
  TDragData = unknown,
> extends BaseUIChangeEventDetails<
  DraggableViewportDragScrollEventReason,
  DraggableViewportDragScrollEventDetailsProperties<TSourcePayload, TDragData>
> {}

export type DraggableViewportDragScrollEventReason = typeof REASONS.none;

export namespace DraggableViewport {
  export type OverflowMargin = DraggableViewportOverflowMargin;
  export type DragScrollDirection = DraggableViewportDragScrollDirection;
  export type MaxSpeedContext<
    TSourcePayload = unknown,
    TDragData = unknown,
  > = DraggableViewportMaxSpeedContext<TSourcePayload, TDragData>;
  export type DragScrollEventDetails<
    TSourcePayload = unknown,
    TDragData = unknown,
  > = DraggableViewportDragScrollEventDetails<TSourcePayload, TDragData>;
  export type DragScrollEventReason = DraggableViewportDragScrollEventReason;
  export type State = DraggableViewportState;
  export type Props<TSourcePayload = unknown, TDragData = unknown> = DraggableViewportProps<
    TSourcePayload,
    TDragData
  >;
}
