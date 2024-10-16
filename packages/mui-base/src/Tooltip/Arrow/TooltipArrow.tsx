'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useTooltipPositionerContext } from '../Positioner/TooltipPositionerContext';
import { useTooltipArrow } from './useTooltipArrow';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';

/**
 * Renders an arrow that points to the center of the anchor element.
 *
 * Demos:
 *
 * - [Tooltip](https://base-ui.netlify.app/components/react-tooltip/)
 *
 * API:
 *
 * - [TooltipArrow API](https://base-ui.netlify.app/components/react-tooltip/#api-reference-TooltipArrow)
 */
const TooltipArrow = React.forwardRef(function TooltipArrow(
  props: TooltipArrow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, hideWhenUncentered = false, ...otherProps } = props;

  const { open, arrowRef, side, alignment, arrowUncentered, arrowStyles } =
    useTooltipPositionerContext();

  const { getArrowProps } = useTooltipArrow({
    arrowStyles,
    hidden: hideWhenUncentered && arrowUncentered,
  });

  const ownerState: TooltipArrow.OwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
    }),
    [open, side, alignment],
  );

  const mergedRef = useForkRef(arrowRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getArrowProps,
    render: render ?? 'div',
    ownerState,
    className,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: popupOpenStateMapping,
  });

  return renderElement();
});

namespace TooltipArrow {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * If `true`, the arrow will be hidden when it can't point to the center of the anchor element.
     * @default false
     */
    hideWhenUncentered?: boolean;
  }
}

TooltipArrow.propTypes /* remove-proptypes */ = {
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
   * If `true`, the arrow will be hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { TooltipArrow };
