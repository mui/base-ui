'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { PopoverTriggerOwnerState, PopoverTriggerProps } from './PopoverTrigger.types';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';

/**
 * Renders a trigger element that opens the popover.
 *
 * Demos:
 *
 * - [Popover](https://mui.com/base-ui/react-popover/)
 *
 * API:
 *
 * - [PopoverTrigger API](https://mui.com/base-ui/react-popover/components-api/#popover-trigger)
 */
const PopoverTrigger = React.forwardRef(function PopoverTrigger(
  props: PopoverTriggerProps,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { render, className, ...otherProps } = props;

  const { open, setTriggerElement, getTriggerProps } = usePopoverRootContext();

  const ownerState: PopoverTriggerOwnerState = React.useMemo(() => ({ open }), [open]);

  const mergedRef = useForkRef(forwardedRef, setTriggerElement);

  const { renderElement } = useComponentRenderer({
    propGetter: getTriggerProps,
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

PopoverTrigger.propTypes /* remove-proptypes */ = {
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

export { PopoverTrigger };
