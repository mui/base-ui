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

  export type Props = BaseUIComponentProps<'div', OwnerState> & {
    /**
     * If `true`, the arrow will be hidden when it can't point to the center of the anchor element.
     * @default false
     */
    hideWhenUncentered?: boolean;
  };
}

TooltipArrow.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
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
