'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { HTMLElementType, refType } from '../../utils/proptypes';
import { PreviewCardPortalContext } from './PreviewCardPortalContext';
import { FloatingPortalLite } from '../../utils/FloatingPortalLite';

/**
 * A portal element that moves the popup to a different part of the DOM.
 * By default, the portal element is appended to `<body>`.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
const PreviewCardPortal: React.FC<PreviewCardPortal.Props> = function PreviewCardPortal(props) {
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
};

namespace PreviewCardPortal {
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

PreviewCardPortal.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * A parent element to render the portal element into.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([HTMLElementType, refType]),
  /**
   * Whether to keep the portal mounted in the DOM while the popup is hidden.
   * @default false
   */
  keepMounted: PropTypes.bool,
} as any;

export { PreviewCardPortal };
