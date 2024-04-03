import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingArrow } from '@floating-ui/react';
import type { ArrowOwnerState, ArrowProps } from './Tooltip.types';
import { resolveClassName } from '../utils/resolveClassName';
import { useTooltipContentContext } from './TooltipContentContext';
import { evaluateRenderProp } from '../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../utils/useRenderPropForkRef';

function defaultRender(props: any, ownerState: ArrowOwnerState) {
  return (
    <FloatingArrow
      context={ownerState.floatingContext}
      tipRadius={ownerState.tipRadius}
      staticOffset={ownerState.staticOffset}
      d={ownerState.d}
      strokeWidth={1}
      stroke="transparent"
      {...props}
    />
  );
}

/**
 * The tooltip arrow caret element.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipArrow API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-arrow)
 */
const TooltipArrow = React.forwardRef(function TooltipArrow(
  props: ArrowProps,
  forwardedRef: React.ForwardedRef<SVGSVGElement>,
) {
  const {
    render: renderProp,
    hideWhenUncentered = false,
    className,
    tipRadius,
    staticOffset,
    d,
    ...otherProps
  } = props;
  const render = renderProp ?? defaultRender;

  const { open, arrowRef, floatingContext, side, alignment } = useTooltipContentContext();

  const ownerState: ArrowOwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
      tipRadius,
      staticOffset,
      d,
      floatingContext,
    }),
    [open, side, alignment, tipRadius, staticOffset, d, floatingContext],
  );

  const mergedRef = useRenderPropForkRef(render, arrowRef, forwardedRef);

  const arrowProps = {
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    ...otherProps,
    style: {
      ...otherProps.style,
      ...(hideWhenUncentered &&
        floatingContext.middlewareData.arrow?.centerOffset !== 0 && {
          visibility: 'hidden' as const,
        }),
    },
  };

  return evaluateRenderProp(render, arrowProps, ownerState);
});

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
   * @ignore
   */
  d: PropTypes.string,
  /**
   * If `true`, the arrow will be hidden when it can't point to the center of the anchor element.
   * @default false
   */
  hideWhenUncentered: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Forces a static offset over dynamic positioning under a certain condition.
   */
  staticOffset: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /**
   * @ignore
   */
  style: PropTypes.object,
  /**
   * The corner radius (rounding) of the arrow tip.
   * @default 0 (sharp)
   */
  tipRadius: PropTypes.number,
} as any;

export { TooltipArrow };
