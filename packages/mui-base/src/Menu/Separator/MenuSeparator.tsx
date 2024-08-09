import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const EMPTY_OBJECT = {};

const MenuSeparator = React.forwardRef(function MenuSeparator(
  props: MenuSeparator.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;
  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState: EMPTY_OBJECT,
    extraProps: {
      role: 'separator',
      ...other,
    },
    ref: forwardedRef,
  });

  return renderElement();
});

MenuSeparator.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

namespace MenuSeparator {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
  }

  export type OwnerState = {};
}

export { MenuSeparator };
