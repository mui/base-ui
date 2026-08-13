'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import type {
  RegisterAutoScrollerParameters,
  WithInferredAccept,
} from '../../types/dragRegistration';
import type { AcceptedDragPayload, AnyDragAccept, DragKind } from '../../types/drag';
import { useDragAutoScrollElement } from './useDragAutoScrollElement';
import type { UseDragAutoScrollElementParameters } from './useDragAutoScrollElement';

/**
 * Overrides how its element auto-scrolls during a drag.
 * Renders a `<div>` element.
 *
 * A scroll container needs no component: the engine walks up from the drag and
 * scrolls whatever scroll containers it finds, with speed proportional to depth
 * into the edge zone. Render this one to change that: `applyScroll` for a
 * surface that has no scroll offsets to move, `disabled` or `canScroll` to leave
 * a container alone, `allowedAxis`, `maxSpeed` and `accept` to tune the rest.
 *
 * Nested containers scroll innermost-first, the outer one taking over only on
 * the axes the inner one leaves unconsumed.
 *
 * Documentation: [Base UI Drag Auto Scroll](https://base-ui.com/react/components/drag-auto-scroll)
 */
export const DragAutoScrollRoot = React.forwardRef(function DragAutoScrollRoot<
  TSourceData = unknown,
>(
  componentProps: DragAutoScrollRootProps<TSourceData>,
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
    allowedAxis,
    applyScroll,
    canScroll,
    disabled,
    maxSpeed,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  // A fresh object per render is fine: `useDragAutoScrollElement` reads it
  // through a ref and never compares it.
  const params = {
    accept,
    allowedAxis,
    applyScroll,
    canScroll,
    disabled,
    maxSpeed,
  } as UseDragAutoScrollElementParameters<TSourceData>;

  const { ref } = useDragAutoScrollElement<TSourceData>(params);

  const state: DragAutoScrollRoot.State = { disabled: disabled ?? false };

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, ref],
    props: [{ children }, elementProps],
  });
  // `React.forwardRef` erases the payload type argument, so the generic signature
  // is restored by hand.
}) as {
  <TSourceData = unknown>(
    props: DragAutoScrollRootProps<TSourceData> & React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
  // Private inference overload for heterogeneous `accept` arrays. Explicit
  // component generics use the payload-keyed overload above.
  <TAccept extends AnyDragAccept = DragKind<unknown>>(
    props: WithInferredAccept<DragAutoScrollRootProps<AcceptedDragPayload<TAccept>>, TAccept> &
      React.RefAttributes<HTMLDivElement>,
  ): React.JSX.Element;
};

export interface DragAutoScrollRootState {
  /** Whether auto-scrolling is disabled. */
  disabled: boolean;
}

// `disabled` is not redeclared here: an intersection member's JSDoc never reaches
// the generated reference, so the description would ship nowhere. It lives on
// `RegisterAutoScrollerParameters` instead, which this inherits.
export type DragAutoScrollRootProps<TSourceData = unknown> = BaseUIComponentProps<
  'div',
  DragAutoScrollRootState
> &
  RegisterAutoScrollerParameters<TSourceData>;

export namespace DragAutoScrollRoot {
  export type State = DragAutoScrollRootState;
  export type Props<TSourceData = unknown> = DragAutoScrollRootProps<TSourceData>;
}
