'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Portal } from '../../portal/Portal';
import { HTMLElementType, refType } from '../../utils/proptypes';

/**
 *
 * Demos:
 *
 * - [Alert Dialog](https://base-ui.com/components/react-alert-dialog/)
 *
 * API:
 *
 * - [TooltipPortal API](https://base-ui.com/components/react-alert-dialog/#api-reference-TooltipPortal)
 */
function TooltipPortal(props: Portal.Props) {
  const { children, keepMounted = false, container } = props;
  return (
    <Portal keepMounted={keepMounted} container={container}>
      {children}
    </Portal>
  );
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

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectPortal API](https://base-ui.com/components/react-select/#api-reference-SelectPortal)
 */
export { TooltipPortal };
