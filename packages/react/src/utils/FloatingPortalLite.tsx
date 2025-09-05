'use client';
import * as ReactDOM from 'react-dom';
import { FloatingPortalProps, useFloatingPortalNode } from '../floating-ui-react';

/**
 * `FloatingPortal` includes tabbable logic handling for focus management.
 * For components that don't need tabbable logic, use `FloatingPortalLite`.
 * @internal
 */
export function FloatingPortalLite(props: FloatingPortalLite.Props) {
  const node = useFloatingPortalNode({ root: props.root });
  return node && ReactDOM.createPortal(props.children, node);
}

export namespace FloatingPortalLite {
  export interface Props {
    children?: React.ReactNode;
    root?: FloatingPortalProps['root'];
  }
}
