'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

const customStyleHookMapping: CustomStyleHookMapping<PopoverTrigger.OwnerState> = {
  open(value) {
    return {
      'data-popover': value ? 'open' : 'closed',
    };
  },
};

/**
 * Renders a trigger element that opens the popover.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.netlify.app/components/react-popover/)
 *
 * API:
 *
 * - [PopoverTrigger API](https://base-ui.netlify.app/components/react-popover/#api-reference-PopoverTrigger)
 */
const PopoverTrigger = React.forwardRef(function PopoverTrigger(
  props: PopoverTrigger.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { render, className, ...otherProps } = props;

  const { open, setTriggerElement, getRootTriggerProps } = usePopoverRootContext();

  const ownerState: PopoverTrigger.OwnerState = React.useMemo(() => ({ open }), [open]);

  const mergedRef = useForkRef(forwardedRef, setTriggerElement);

  const { renderElement } = useComponentRenderer({
    propGetter: getRootTriggerProps,
    render: render ?? 'button',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  return renderElement();
});

namespace PopoverTrigger {
  export interface OwnerState {
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<any, OwnerState> {}
}

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
