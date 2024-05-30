'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTooltipRootContext } from '../Root/TooltipRootContext';
import type { TooltipTriggerProps } from './TooltipTrigger.types';
import { tooltipTriggerStyleHookMapping } from './styleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';

/**
 * Renders a trigger element that will open the tooltip.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipTrigger API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-trigger)
 */
const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  props: TooltipTriggerProps,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { className, render, ...otherProps } = props;

  const { open, setTriggerElement, getTriggerProps } = useTooltipRootContext();

  const ownerState = React.useMemo(() => ({ open }), [open]);
  const mergedRef = useForkRef(setTriggerElement, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getTriggerProps,
    render: render ?? 'button',
    className,
    ownerState,
    extraProps: otherProps,
    ref: mergedRef,
    customStyleHookMapping: tooltipTriggerStyleHookMapping,
  });

  return renderElement();
});

TooltipTrigger.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { TooltipTrigger };
