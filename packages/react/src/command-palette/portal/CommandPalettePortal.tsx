'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useCommandPaletteRootContext } from '../root/CommandPaletteRootContext';
import { CommandPalettePortalContext } from './CommandPalettePortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 */
export const CommandPalettePortal = React.forwardRef(function CommandPalettePortal(
  props: CommandPalettePortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted = false, container, children, ...portalProps } = props;

  const { store } = useCommandPaletteRootContext(true);
  const mounted = store.useState('mounted');

  const [portalNode, setPortalNode] = React.useState<HTMLDivElement | null>(null);
  const containerElement = React.useMemo(() => {
    if (container) {
      if ('current' in container) {
        return container.current;
      }
      return container;
    }
    return typeof document !== 'undefined' ? document.body : null;
  }, [container]);

  const shouldRender = mounted || keepMounted;

  React.useEffect((): (() => void) | void => {
    if (!shouldRender || !containerElement) {
      setPortalNode(null);
      return;
    }

    const node = document.createElement('div');
    containerElement.appendChild(node);
    setPortalNode(node);

    return () => {
      if (containerElement.contains(node)) {
        containerElement.removeChild(node);
      }
    };
  }, [shouldRender, containerElement]);

  if (!shouldRender) {
    return null;
  }

  return (
    <CommandPalettePortalContext.Provider value={keepMounted}>
      {portalNode &&
        ReactDOM.createPortal(
          <div ref={forwardedRef} {...portalProps}>
            {children}
          </div>,
          portalNode,
        )}
    </CommandPalettePortalContext.Provider>
  );
});

export namespace CommandPalettePortal {
  export interface Props extends React.HTMLAttributes<HTMLDivElement> {
    /**
     * If `true`, the portal will keep its content mounted even when the command palette is closed.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * A parent element to render the portal element into.
     * @default document.body
     */
    container?: HTMLElement | ShadowRoot | null | React.RefObject<HTMLElement | ShadowRoot | null>;
    /**
     * The content to render in the portal.
     */
    children?: React.ReactNode;
  }
  export interface State {}
}
