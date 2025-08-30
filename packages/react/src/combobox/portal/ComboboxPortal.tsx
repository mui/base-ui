'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { FloatingPortal } from '../../floating-ui-react';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { ComboboxPortalContext } from './ComboboxPortalContext';
import { selectors } from '../store';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function ComboboxPortal(props: ComboboxPortal.Props) {
  const { children, keepMounted = false, container } = props;

  const { store } = useComboboxRootContext();
  const mounted = useStore(store, selectors.mounted);
  const forceMount = useStore(store, selectors.forceMount);

  const shouldRender = mounted || keepMounted || forceMount;
  if (!shouldRender) {
    return null;
  }

  return (
    <ComboboxPortalContext.Provider value={keepMounted}>
      <FloatingPortal root={container}>{children}</FloatingPortal>
    </ComboboxPortalContext.Provider>
  );
}

export namespace ComboboxPortal {
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
    container?: HTMLElement | null | React.RefObject<HTMLElement | null>;
  }
}
