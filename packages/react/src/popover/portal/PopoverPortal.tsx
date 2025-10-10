'use client';
import * as React from 'react';
import { FloatingPortal } from '../../floating-ui-react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { PopoverPortalContext } from './PopoverPortalContext';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverPortal = React.forwardRef(function PopoverPortal(
  props: PopoverPortal.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { keepMounted = false, ...portalProps } = props;

  const { store } = usePopoverRootContext();
  const mounted = store.useState('mounted');

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <PopoverPortalContext.Provider value={keepMounted}>
      <FloatingPortal ref={forwardedRef} {...portalProps} renderGuards={false} />
    </PopoverPortalContext.Provider>
  );
});

export namespace PopoverPortal {
  export interface State {}
}

export interface PopoverPortalProps extends FloatingPortal.Props<PopoverPortal.State> {
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted?: boolean;
}

export namespace PopoverPortal {
  export type Props = PopoverPortalProps;
}
