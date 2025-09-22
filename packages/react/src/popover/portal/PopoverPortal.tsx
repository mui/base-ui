'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { FloatingPortal, FloatingPortalProps } from '../../floating-ui-react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { PopoverPortalContext } from './PopoverPortalContext';
import { selectors } from '../store';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export function PopoverPortal(props: PopoverPortal.Props) {
  const { children, keepMounted = false, container } = props;

  const { store } = usePopoverRootContext();
  const mounted = useStore(store, selectors.mounted);

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <PopoverPortalContext.Provider value={keepMounted}>
      <FloatingPortal root={container} renderGuards={false}>
        {children}
      </FloatingPortal>
    </PopoverPortalContext.Provider>
  );
}

export namespace PopoverPortal {
  export interface Props {
    children?: React.ReactNode;
    /**
     * Whether to keep the portal mounted in the DOM while the popup is hidden.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * A parent element to render the portal element into.
     */
    container?: FloatingPortalProps['root'];
  }
}
