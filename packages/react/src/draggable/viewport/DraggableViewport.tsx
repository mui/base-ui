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
  <TAccept extends DraggableAccept<unknown> = DraggableKind<unknown>>(
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

/** Outside distances in CSS pixels. Physical edges are independent of text direction. */
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
   * The position used to determine scrolling. It may differ from the modified
   * drag position when a modifier separates that position from the pointer.
   */
  input: DraggableInput;
  source: DraggableRootRecord<TSourcePayload, TDragData>;
  element: HTMLElement;
}

/** The first argument of `onDragScroll`: the dragged item and the movement for this frame. */
export interface DraggableViewportDragScrollValue<TSourcePayload = unknown, TDragData = unknown> {
  /** The item being dragged. */
  source: DraggableRootRecord<TSourcePayload, TDragData>;
  /**
   * How far to move horizontally this frame, in CSS pixels, with `scrollBy`
   * semantics: a positive value moves the view right, so the content slides left
   * under the pointer. Apply this delta as-is, without multiplying by elapsed time.
   * `0` when the horizontal axis isn't engaged this frame.
   */
  x: number;
  /** How far to move vertically this frame, in CSS pixels. A positive value moves the view down. */
  y: number;
  /** The axis this call is about. `onDragScroll` is called once per engaged axis. */
  direction: DraggableViewportDragScrollDirection;
}

export type DraggableViewportDragScrollDirection = 'horizontal' | 'vertical';

/** The properties `onDragScroll`'s event details add to the Base UI change details. */
interface DraggableViewportDragScrollEventDetailsProperties {
  /**
   * The position used to determine scrolling. It may differ from the modified
   * drag position when a modifier separates that position from the pointer.
   */
  input: DraggableInput;
  /** The scroll container. */
  element: HTMLElement;
  /**
   * Claims this direction, so that ancestor viewports don't scroll on the same axis.
   * Skip it at a bound the element can't move past, so an ancestor can scroll instead.
   */
  consume: () => void;
  /** Whether {@link consume} has been called. */
  isConsumed: boolean;
}

/**
 * The event details passed as the second argument to `onDragScroll`.
 * Call `cancel()` to prevent Base UI from scrolling the container in this direction.
 * `event` is a placeholder: the scroll loop runs from animation frames, not from a native event.
 */
// An interface so the API reference prints its name instead of expanding it.
export interface DraggableViewportDragScrollEventDetails extends BaseUIChangeEventDetails<
  DraggableViewportDragScrollEventReason,
  DraggableViewportDragScrollEventDetailsProperties
> {}

export type DraggableViewportDragScrollEventReason = typeof REASONS.none;

export namespace DraggableViewport {
  export type OverflowMargin = DraggableViewportOverflowMargin;
  export type DragScrollDirection = DraggableViewportDragScrollDirection;
  export type MaxSpeedContext<
    TSourcePayload = unknown,
    TDragData = unknown,
  > = DraggableViewportMaxSpeedContext<TSourcePayload, TDragData>;
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
