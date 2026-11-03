'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ownerDocument } from '@base-ui/utils/owner';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
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
  componentProps: DraggablePortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { container, className, render, style, ...elementProps } = componentProps;
  const rootContext = useDraggableRootContext();
  // Inside a preview, the parts render nothing, so a copy of them doesn't recurse.
  const inPreview = React.useContext(DraggablePositionerContext) !== undefined;
  const active = (rootContext.dragging || rootContext.settling) && !inPreview;

  // Resolved while rendering, so the preview mounts in the commit that starts the drag.
  // A container that mounted before the drag has its ref set by then.
  const containerElement = active ? resolveContainer(container, rootContext) : null;
  const waitingForRef = active && containerElement === null && container != null;
  // A ref that isn't set yet gets one more render. A later sibling's ref attaches after
  // this effect, so the retry runs whether or not the ref is set here.
  const [, retry] = React.useReducer((count: number) => count + 1, 0);
  const retriedRef = React.useRef(false);
  useIsoLayoutEffect(() => {
    if (!waitingForRef) {
      retriedRef.current = false;
    } else if (!retriedRef.current) {
      retriedRef.current = true;
      retry();
    }
  });

  const element = useRenderElement('div', componentProps, {
    enabled: containerElement !== null,
    ref: forwardedRef,
    props: elementProps,
  });

  if (containerElement === null || element === null) {
    return null;
  }
  return ReactDOM.createPortal(element, containerElement);
});

function resolveContainer(
  container: DraggablePortalProps['container'],
  rootContext: ReturnType<typeof useDraggableRootContext>,
): HTMLElement | ShadowRoot | null {
  if (container === undefined) {
    const source = rootContext.getPreview()?.getSourceElement();
    return (source ? ownerDocument(source) : document).body;
  }
  if (container === null) {
    return null;
  }
  return 'current' in container ? container.current : container;
}

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
