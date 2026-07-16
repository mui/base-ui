'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { type BaseUIComponentProps } from '../internals/types';
import { useFloatingPortalNode } from '../floating-ui-react/components/FloatingPortal';

type PortalContainer =
  | HTMLElement
  | ShadowRoot
  | React.RefObject<HTMLElement | ShadowRoot | null>
  | null;

/**
 * `FloatingPortal` includes tabbable logic handling for focus management.
 * For components that don't need tabbable logic, use `FloatingPortalLite`.
 * @internal
 */
export const FloatingPortalLite = React.forwardRef(function FloatingPortalLite(
  componentProps: FloatingPortalLite.Props<any>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, container, className, render, style, ...elementProps } = componentProps;

  const { portalNode, portalSubtree } = useFloatingPortalNode({
    container,
    ref: forwardedRef,
    componentProps,
    elementProps,
  });

  if (!portalSubtree && !portalNode) {
    return null;
  }

  return (
    <React.Fragment>
      {portalSubtree}
      {portalNode && ReactDOM.createPortal(children, portalNode)}
    </React.Fragment>
  );
});

export interface FloatingPortalLiteState {}

export interface FloatingPortalLiteProps<TState> extends BaseUIComponentProps<'div', TState> {
  container?: PortalContainer | undefined;
}

export namespace FloatingPortalLite {
  export type State = FloatingPortalLiteState;
  export type Props<TState> = FloatingPortalLiteProps<TState>;
}
