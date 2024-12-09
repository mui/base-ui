'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { SelectScrollArrow } from '../scroll-arrow/SelectScrollArrow';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectScrollDownArrow = React.forwardRef(function SelectScrollDownArrow(
  props: SelectScrollDownArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  return <SelectScrollArrow {...props} ref={forwardedRef} direction="down" />;
});

namespace SelectScrollDownArrow {
  export interface State {}
  export interface Props extends BaseUIComponentProps<'div', State> {
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
