'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import { useMenuArrow } from './useMenuArrow';
import { useMenuPositionerContext } from '../Positioner/MenuPositionerContext';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { commonStyleHooks } from '../utils/commonStyleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Renders an arrow that points to the center of the anchor element.
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-menu/)
 *
 * API:
 *
 * - [MenuArrow API](https://mui.com/base-ui/react-menu/components-api/#menu-arrow)
 */
const MenuArrow = React.forwardRef(function MenuArrow(
  props: MenuArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, hideWhenUncentered = false, ...otherProps } = props;

  const { open } = useMenuRootContext();
  const { arrowRef, side, alignment, arrowUncentered, arrowStyles } = useMenuPositionerContext();

  const { getArrowProps } = useMenuArrow({
    arrowStyles,
    hidden: hideWhenUncentered && arrowUncentered,
  });

  const ownerState: MenuArrow.OwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
      arrowUncentered,
    }),
    [open, side, alignment, arrowUncentered],
  );

  const mergedRef = useForkRef(arrowRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getArrowProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: commonStyleHooks,
  });

  return renderElement();
});

namespace MenuArrow {
  export type OwnerState = {
    open: boolean;
    side: Side;
    alignment: Alignment;
    arrowUncentered: boolean;
  };

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * If `true`, the arrow is hidden when it can't point to the center of the anchor element.
     * @default false
     */
    hideWhenUncentered?: boolean;
  }
}

MenuArrow.propTypes /* remove-proptypes */ = {
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
   * If `true`, the arrow is hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { MenuArrow };
