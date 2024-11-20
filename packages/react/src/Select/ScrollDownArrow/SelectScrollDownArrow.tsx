'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { SelectScrollArrow } from '../ScrollArrow/SelectScrollArrow';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 *
 * Demos:
 *
 * - [Select](https://base-ui.com/components/react-select/)
 *
 * API:
 *
 * - [SelectScrollDownArrow API](https://base-ui.com/components/react-select/#api-reference-SelectScrollDownArrow)
 */
const SelectScrollDownArrow = React.forwardRef(function SelectScrollDownArrow(
  props: SelectScrollDownArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <SelectScrollArrow {...props} ref={forwardedRef} direction="down" />;
});

namespace SelectScrollDownArrow {
  export interface OwnerState {}
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * Whether the component should be kept mounted when it is not rendered.
     * @default false
     */
    keepMounted?: boolean;
  }
}

SelectScrollDownArrow.propTypes /* remove-proptypes */ = {
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

export { SelectScrollDownArrow };
