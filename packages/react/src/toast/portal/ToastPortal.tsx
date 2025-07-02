'use client';
import * as React from 'react';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';

/**
 * A portal element that moves the viewport to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Toast](https://base-ui.com/react/components/toast)
 */
export function ToastPortal(props: ToastPortal.Props) {
  const { children, container } = props;
  return <FloatingPortalLite root={container}>{children}</FloatingPortalLite>;
}

export namespace ToastPortal {
  export interface Props {
    children?: React.ReactNode;
    /**
     * A parent element to render the portal element into.
     */
    container?: HTMLElement | null | React.RefObject<HTMLElement | null>;
  }
}
