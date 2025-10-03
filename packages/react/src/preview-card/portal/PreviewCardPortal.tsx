'use client';
import * as React from 'react';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { PreviewCardPortalContext } from './PreviewCardPortalContext';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';
import type { FloatingPortalProps } from '../../floating-ui-react';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export function PreviewCardPortal(props: PreviewCardPortal.Props) {
  const { children, keepMounted = false, container } = props;

  const { mounted } = usePreviewCardRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <PreviewCardPortalContext.Provider value={keepMounted}>
      <FloatingPortalLite root={container}>{children}</FloatingPortalLite>
    </PreviewCardPortalContext.Provider>
  );
}

export interface PreviewCardPortalProps {
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

export namespace PreviewCardPortal {
  export type Props = PreviewCardPortalProps;
}
