'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Portal } from '../../portal/Portal';
import { HTMLElementType, refType } from '../../utils/proptypes';

/**
 *
 * Demos:
 *
 * - [Dialog](https://base-ui.com/components/react-dialog/)
 *
 * API:
 *
 * - [DialogPortal API](https://base-ui.com/components/react-dialog/#api-reference-DialogPortal)
 */
function DialogPortal(props: Portal.Props) {
  const { children, keepMounted = false, container } = props;
  return (
    <Portal keepMounted={keepMounted} container={container}>
      {children}
    </Portal>
  );
}

namespace DialogPortal {
  export interface Props extends Portal.Props {}
  export interface State extends Portal.State {}
}

DialogPortal.propTypes /* remove-proptypes */ = {
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

export { DialogPortal };
