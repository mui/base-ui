'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { Portal } from '../../portal/Portal';
import { HTMLElementType, refType } from '../../utils/proptypes';

/**
 * Renders a portal element that moves its children to a different part of the DOM.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
function SelectPortal(props: SelectPortal.Props) {
  const { children, container } = props;
  return (
    <Portal container={container} keepMounted>
      {children}
    </Portal>
  );
}

namespace SelectPortal {
  export interface Props extends Omit<Portal.Props, 'keepMounted'> {}
  export interface State extends Portal.State {}
}

SelectPortal.propTypes /* remove-proptypes */ = {
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
} as any;

export { SelectPortal };
