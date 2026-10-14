'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import type { BaseUIComponentProps } from '../../../internals/types';
import { usePopupPortalNode } from './PopupPortal';

type PortalContainer =
  HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null;

/**
 * `PopupPortal` includes tabbable logic handling for focus management.
 * For components that don't need tabbable logic, use `PopupPortalLite`.
 * @internal
 */
export const PopupPortalLite = React.forwardRef(function PopupPortalLite(
  componentProps: PopupPortalLite.Props<any>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, container, className, render, style, ...elementProps } = componentProps;

  const { node: portalNode, subtree: portalSubtree } = usePopupPortalNode({
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

export interface PopupPortalLiteState {}

export interface PopupPortalLiteProps<TState> extends BaseUIComponentProps<'div', TState> {
  container?: PortalContainer | undefined;
}

export namespace PopupPortalLite {
  export type State = PopupPortalLiteState;
  export type Props<TState> = PopupPortalLiteProps<TState>;
}
