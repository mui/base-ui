'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useMenuRadioItemContext } from '../RadioItem/MenuRadioItemContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';
import { itemMapping } from '../utils/styleHookMapping';

/**
 *
 * Demos:
 *
 * - [Menu](https://base-ui.netlify.app/components/react-menu/)
 *
 * API:
 *
 * - [MenuRadioItemIndicator API](https://base-ui.netlify.app/components/react-menu/#api-reference-MenuRadioItemIndicator)
 */
const MenuRadioItemIndicator = React.forwardRef(function MenuRadioItemIndicatorComponent(
  props: MenuRadioItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = true, ...other } = props;

  const ownerState = useMenuRadioItemContext();

  const { renderElement } = useComponentRenderer({
    render: render || 'span',
    className,
    ownerState,
    customStyleHookMapping: itemMapping,
    extraProps: other,
    ref: forwardedRef,
  });

  if (!keepMounted && !ownerState.checked) {
    return null;
  }

  return renderElement();
});

MenuRadioItemIndicator.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, the component is mounted even if the Radio is not checked.
   *
   * @default true
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

namespace MenuRadioItemIndicator {
  export interface Props extends BaseUIComponentProps<'span', OwnerState> {
    /**
     * If `true`, the component is mounted even if the Radio is not checked.
     *
     * @default true
     */
    keepMounted?: boolean;
  }

  export interface OwnerState {
    checked: boolean;
    disabled: boolean;
    highlighted: boolean;
  }
}

export { MenuRadioItemIndicator };
