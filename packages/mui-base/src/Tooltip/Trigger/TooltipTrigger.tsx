'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useTooltipRootContext } from '../Root/TooltipRootContext';
import type { TooltipTriggerProps } from './TooltipTrigger.types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';

/**
 * Renders a trigger element that opens the tooltip.
 *
 * Demos:
 *
 * - [Tooltip](https://base-ui.netlify.app/components/react-tooltip/)
 *
 * API:
 *
 * - [TooltipTrigger API](https://base-ui.netlify.app/components/react-tooltip/#api-reference-TooltipTrigger)
 */
const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  props: TooltipTriggerProps,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { className, render, ...otherProps } = props;

  const { open, setTriggerElement, getRootTriggerProps } = useTooltipRootContext();

  const ownerState = React.useMemo(() => ({ open }), [open]);

  const mergedRef = useForkRef(forwardedRef, setTriggerElement);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootTriggerProps,
    render: render ?? 'button',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: {
      open(value) {
        return {
          'data-state': value ? 'open' : 'closed',
        };
      },
    },
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
