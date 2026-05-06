'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useFullscreenRootContext } from '../root/FullscreenRootContext';
import { FullscreenPortalContext } from './FullscreenPortalContext';

/**
 * A portal that mounts its children outside the regular React tree (by default
 * into `<body>`) only while the container is in fullscreen.
 *
 * Useful for "dialog-like" fullscreen UI: the trigger lives in the regular
 * page, and the fullscreen content is absent from the DOM until the user
 * enters fullscreen.
 *
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Fullscreen](https://base-ui.com/react/components/fullscreen)
 */
export function FullscreenPortal(props: FullscreenPortal.Props) {
  const { children, container, keepMounted = false } = props;

  const { store } = useFullscreenRootContext();
  const open = store.useState('open');

  if (!open && !keepMounted) {
    return null;
  }
  if (typeof document === 'undefined') {
    return null;
  }

  const target = resolveContainer(container);
  if (!target) {
    return null;
  }

  return (
    <FullscreenPortalContext.Provider value={keepMounted}>
      {ReactDOM.createPortal(children, target)}
    </FullscreenPortalContext.Provider>
  );
}

function resolveContainer(
  container: FullscreenPortal.Container | undefined,
): Element | DocumentFragment | null {
  if (container == null) {
    return typeof document !== 'undefined' ? document.body : null;
  }
  if (typeof container === 'function') {
    return container() ?? null;
  }
  if ('current' in container) {
    return container.current ?? null;
  }
  return container;
}

export interface FullscreenPortalProps {
  /**
   * Whether to keep the contents mounted in the DOM while the container is
   * not in fullscreen.
   * @default false
   */
  keepMounted?: boolean | undefined;
  /**
   * The element to portal into. Defaults to `document.body`.
   */
  container?: FullscreenPortalContainer | undefined;
  /**
   * The content of the portal.
   */
  children?: React.ReactNode | undefined;
}

export type FullscreenPortalContainer =
  | Element
  | DocumentFragment
  | React.RefObject<Element | DocumentFragment | null>
  | (() => Element | DocumentFragment | null)
  | null;

export namespace FullscreenPortal {
  export type Props = FullscreenPortalProps;
  export type Container = FullscreenPortalContainer;
}
