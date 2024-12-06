'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { refType, HTMLElementType } from '../../utils/proptypes';

/**
 *
 * Demos:
 *
 * - [Tooltip](https://base-ui.com/components/react-tooltip/)
 *
 * API:
 *
 * - [TooltipPortal API](https://base-ui.com/components/react-tooltip/#api-reference-TooltipPortal)
 */
const TooltipPortal: TooltipPortal = function TooltipPortal(props: TooltipPortal.Props) {
  const { children, container, keepMounted = false } = props;

  const { mounted } = useTooltipRootContext();

  const shouldRender = mounted || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return <FloatingPortal root={container}>{children}</FloatingPortal>;
};

namespace TooltipPortal {
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

interface TooltipPortal {
  (props: TooltipPortal.Props): React.JSX.Element | null;
  propTypes?: any;
}

TooltipPortal.propTypes /* remove-proptypes */ = {
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

export { TooltipPortal };
