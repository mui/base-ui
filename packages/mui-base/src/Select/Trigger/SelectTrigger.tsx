'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectTrigger } from './useSelectTrigger';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { commonStyleHooks } from '../utils/commonStyleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { BaseUIComponentProps } from '../../utils/types';

const SelectTrigger = React.forwardRef(function SelectTrigger(
  props: SelectTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { render, className, disabled = false, label, ...other } = props;

  const {
    getTriggerProps,
    disabled: menuDisabled,
    setTriggerElement,
    open,
    setOpen,
    setClickAndDragEnabled,
  } = useSelectRootContext();

  const { getRootProps } = useSelectTrigger({
    disabled: disabled || menuDisabled,
    rootRef: forwardedRef,
    setTriggerElement,
    open,
    setOpen,
    setClickAndDragEnabled,
  });

  const ownerState: SelectTrigger.OwnerState = React.useMemo(() => ({ open }), [open]);

  const { renderElement } = useComponentRenderer({
    render: render ?? 'button',
    className,
    ownerState,
    propGetter: (externalProps) => getTriggerProps(getRootProps(externalProps)),
    customStyleHookMapping: commonStyleHooks,
    extraProps: other,
  });

  return renderElement();
});

namespace SelectTrigger {
  export interface Props extends BaseUIComponentProps<'button', OwnerState> {
    children?: React.ReactNode;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * If `true`, allows a disabled button to receive focus.
     * @default false
     */
    focusableWhenDisabled?: boolean;
    /**
     * Label of the button
     */
    label?: string;
  }

  export type OwnerState = {
    open: boolean;
  };
}

SelectTrigger.propTypes /* remove-proptypes */ = {
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
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, allows a disabled button to receive focus.
   * @default false
   */
  focusableWhenDisabled: PropTypes.bool,
  /**
   * Label of the button
   */
  label: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectTrigger };
