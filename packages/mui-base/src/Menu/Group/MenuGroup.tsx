import * as React from 'react';
import PropTypes from 'prop-types';
import { BaseUIComponentProps } from '../../utils/types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

const EMPTY_OBJECT = {};

/**
 *
 * Demos:
 *
 * - [Menu](https://base-ui.netlify.app/components/react-menu/)
 *
 * API:
 *
 * - [MenuGroup API](https://base-ui.netlify.app/components/react-menu/#api-reference-MenuGroup)
 */
const MenuGroup = React.forwardRef(function MenuGroup(
  props: MenuGroup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;
  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState: EMPTY_OBJECT,
    extraProps: {
      role: 'group',
      ...other,
    },
    ref: forwardedRef,
  });

  return renderElement();
});

MenuGroup.propTypes /* remove-proptypes */ = {
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

namespace MenuGroup {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * The content of the component.
     */
    children?: React.ReactNode;
  }

  export interface OwnerState {}
}

export { MenuGroup };
