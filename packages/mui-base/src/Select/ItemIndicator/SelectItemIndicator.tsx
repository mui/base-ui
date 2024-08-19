'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useSelectPositionerContext } from '../Positioner/SelectPositionerContext';
import { commonStyleHooks } from '../utils/commonStyleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useSelectItemContext } from '../Item/SelectItemContext';

const customStyleHookMapping: CustomStyleHookMapping<SelectItemIndicator.OwnerState> = {
  ...commonStyleHooks,
  entering(value) {
    return value ? { 'data-select-entering': '' } : null;
  },
  exiting(value) {
    return value ? { 'data-select-exiting': '' } : null;
  },
};

const SelectItemIndicator = React.forwardRef(function SelectItemIndicator(
  props: SelectItemIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, keepMounted = false, ...otherProps } = props;

  const { open, transitionStatus } = useSelectRootContext();
  const { side, alignment } = useSelectPositionerContext();
  const { selected } = useSelectItemContext();

  const ownerState: SelectItemIndicator.OwnerState = React.useMemo(
    () => ({
      entering: transitionStatus === 'entering',
      exiting: transitionStatus === 'exiting',
      side,
      alignment,
      open,
      selected,
    }),
    [transitionStatus, side, alignment, open, selected],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'span',
    ref: forwardedRef,
    className,
    ownerState,
    customStyleHookMapping,
    extraProps: otherProps,
  });

  const shouldRender = selected || keepMounted;
  if (!shouldRender) {
    return null;
  }

  return renderElement();
});

namespace SelectItemIndicator {
  export interface Props extends BaseUIComponentProps<'span', OwnerState> {
    children?: React.ReactNode;
    /**
     * If `true`, the item indicator remains mounted when the item is not
     * selected.
     * @default false
     */
    keepMounted?: boolean;
  }

  export interface OwnerState {
    entering: boolean;
    exiting: boolean;
    side: Side;
    alignment: 'start' | 'end' | 'center';
    open: boolean;
    selected: boolean;
  }
}

SelectItemIndicator.propTypes /* remove-proptypes */ = {
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
   * If `true`, the item indicator remains mounted when the item is not
   * selected.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectItemIndicator };
