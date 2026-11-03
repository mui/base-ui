'use client';
import * as React from 'react';
import { FloatingPortalLite } from '../../utils/popups/portal/FloatingPortalLite';
import type { BaseUIComponentProps } from '../../internals/types';
import { useDraggableRootContext } from '../root/DraggableRootContext';
import { DraggablePositionerContext } from '../positioner/DraggablePositionerContext';

/**
 * A portal element that moves the drag preview to a different part of the DOM, out of
 * ancestors that clip or transform it. By default, the portal element is appended to `<body>`.
 * Renders only while its item is dragged, and until the preview settles after the drop.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Draggable](https://base-ui.com/react/utils/draggable)
 */
export const DraggablePortal = React.forwardRef(function DraggablePortal(
  props: DraggablePortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const rootContext = useDraggableRootContext();
  // Inside a preview, the parts render nothing, so a copy of them doesn't recurse.
  const inPreview = React.useContext(DraggablePositionerContext) !== undefined;

  if ((!rootContext.dragging && !rootContext.settling) || inPreview) {
    return null;
  }

  return <FloatingPortalLite ref={forwardedRef} {...props} />;
});

export interface DraggablePortalState {}

export interface DraggablePortalProps extends BaseUIComponentProps<'div', DraggablePortalState> {
  /**
   * A parent element to render the portal element into.
   */
  container?:
    HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null | undefined;
}

export namespace DraggablePortal {
  export type State = DraggablePortalState;
  export type Props = DraggablePortalProps;
}
