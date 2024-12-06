'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { refType, HTMLElementType } from '../../utils/proptypes';

/**
 *
 * Demos:
 *
 * - [Preview Card](https://base-ui.com/components/react-preview-card/)
 *
 * API:
 *
 * - [PreviewCardPortal API](https://base-ui.com/components/react-preview-card/#api-reference-PreviewCardPortal)
 */
const PreviewCardPortal: PreviewCardPortal = function PreviewCardPortal(
  props: PreviewCardPortal.Props,
) {
  const { children, container, keepMounted = false } = props;

  const { mounted } = usePreviewCardRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{children}</FloatingPortal>;
};

namespace PreviewCardPortal {
  export interface Props {
    children?: React.ReactNode;
    /**
     * The container to render the portal element into.
     */
    container?: HTMLElement | null | React.RefObject<HTMLElement | null>;
    /**
     * Whether to keep the portal mounted in the DOM when the popup is closed.
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface State {}
}

interface PreviewCardPortal {
  (props: PreviewCardPortal.Props): React.JSX.Element | null;
  propTypes?: any;
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
   * The container to render the portal element into.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([HTMLElementType, refType]),
  /**
   * Whether to keep the portal mounted in the DOM when the popup is closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
} as any;

export { PreviewCardPortal };
