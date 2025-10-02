'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useFloatingPortalNode, type FloatingPortal } from '../floating-ui-react';
import type { BaseUIComponentProps } from '../utils/types';

/**
 * `FloatingPortal` includes tabbable logic handling for focus management.
 * For components that don't need tabbable logic, use `FloatingPortalLite`.
 * @internal
 */
export const FloatingPortalLite = React.forwardRef(function FloatingPortalLite(
  props: FloatingPortalLite.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, container, className, render, ...elementProps } = props;

  const componentProps = React.useMemo(() => ({ className, render }), [className, render]);

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

export namespace FloatingPortalLite {
  export interface State {}

  export interface Props
    extends BaseUIComponentProps<'div', State, React.HTMLAttributes<HTMLDivElement>> {
    children?: React.ReactNode;
    container?: FloatingPortal.Props['container'];
  }
}
