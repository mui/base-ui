'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { Side } from '@floating-ui/react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useSelectRootContext } from '../Root/SelectRootContext';
import { useSelectPositionerContext } from '../Positioner/SelectPositionerContext';
import { commonStyleHooks } from '../utils/commonStyleHooks';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

const customStyleHookMapping: CustomStyleHookMapping<SelectPopup.OwnerState> = {
  ...commonStyleHooks,
  entering(value) {
    return value ? { 'data-menu-entering': '' } : null;
  },
  exiting(value) {
    return value ? { 'data-menu-exiting': '' } : null;
  },
};

const SelectPopup = React.forwardRef(function SelectPopup(
  props: SelectPopup.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, ...other } = props;
  const { open, popupRef, transitionStatus } = useSelectRootContext();
  const { side, alignment } = useSelectPositionerContext();

  const mergedRef = useForkRef(forwardedRef, popupRef);

  const ownerState: SelectPopup.OwnerState = React.useMemo(
    () => ({
      entering: transitionStatus === 'entering',
      exiting: transitionStatus === 'exiting',
      side,
      alignment,
      open,
    }),
    [transitionStatus, side, alignment, open],
  );

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: other,
    customStyleHookMapping,
    ref: mergedRef,
  });

  return renderElement();
});

namespace SelectPopup {
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    children?: React.ReactNode;
    /**
     * The id of the popup element.
     */
    id?: string;
  }

  export interface OwnerState {
    entering: boolean;
    exiting: boolean;
    side: Side;
    alignment: 'start' | 'end' | 'center';
    open: boolean;
  }
}

SelectPopup.propTypes /* remove-proptypes */ = {
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
   * The id of the popup element.
   */
  id: PropTypes.string,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { SelectPopup };
