'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { SelectScrollArrow } from '../ScrollArrow/SelectScrollArrow';
import type { BaseUIComponentProps } from '../../utils/types';
/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.netlify.app/components/react-select/)
 *
 * API:
 *
 * - [SelectScrollUpArrow API](https://base-ui.netlify.app/components/react-select/#api-reference-SelectScrollUpArrow)
 */
const SelectScrollUpArrow = React.forwardRef(function SelectScrollUpArrow(
  props: SelectScrollUpArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <SelectScrollArrow {...props} ref={forwardedRef} direction="up" />;
});

namespace SelectScrollUpArrow {
  export interface OwnerState {}
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * Whether the component should be kept mounted when it is not rendered.
     * @default false
     */
    keepMounted?: boolean;
  }
}

SelectScrollUpArrow.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Whether the component should be kept mounted when it is not rendered.
   * @default false
   */
  keepMounted: PropTypes.bool,
} as any;

export { SelectScrollUpArrow };
