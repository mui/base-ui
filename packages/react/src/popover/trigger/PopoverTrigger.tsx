'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useButton } from '../../use-button/useButton';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { BaseUIComponentProps } from '../../utils/types';
import {
  triggerOpenStateMapping,
  pressableTriggerOpenStateMapping,
} from '../../utils/popupStateMapping';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

/**
 * A button that opens the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverTrigger = React.forwardRef(function PopoverTrigger(
  props: PopoverTrigger.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const { render, className, disabled = false, ...otherProps } = props;

  const { mounted, setTriggerElement, getRootTriggerProps, openReason } = usePopoverRootContext();

  const state: PopoverTrigger.State = React.useMemo(
    () => ({
      disabled,
      open: mounted,
    }),
    [disabled, mounted],
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    buttonRef: forwardedRef,
  });

  const mergedRef = useForkRef(buttonRef, setTriggerElement);

  const customStyleHookMapping: CustomStyleHookMapping<{ open: boolean }> = React.useMemo(
    () => ({
      open(value) {
        if (value && openReason === 'click') {
          return pressableTriggerOpenStateMapping.open(value);
        }

        return triggerOpenStateMapping.open(value);
      },
    }),
    [openReason],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: (externalProps) => getButtonProps(getRootTriggerProps(externalProps)),
    render: render ?? 'button',
    className,
    state,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping,
  });

  return renderElement();
});

namespace PopoverTrigger {
  export interface State {
    /**
     * Whether the popover is currently disabled.
     */
    disabled: boolean;
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {}
}

PopoverTrigger.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * @ignore
   */
  disabled: PropTypes.bool,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PopoverTrigger };
