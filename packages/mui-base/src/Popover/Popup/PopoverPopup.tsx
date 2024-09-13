'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePopoverPositionerContext } from '../Positioner/PopoverPositionerContext';
import { usePopoverPopup } from './usePopoverPopup';
import { useForkRef } from '../../utils/useForkRef';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';

/**
 * Renders the popover popup element.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.netlify.app/components/react-popover/)
 *
 * API:
 *
 * - [PopoverPopup API](https://base-ui.netlify.app/components/react-popover/#api-reference-PopoverPopup)
 */
const PopoverPopup = React.forwardRef(function PopoverPopup(
  props: PopoverPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...otherProps } = props;

  const {
    open,
    instantType,
    transitionStatus,
    getRootPopupProps,
    titleId,
    descriptionId,
    popupRef,
  } = usePopoverRootContext();
  const { side, alignment } = usePopoverPositionerContext();

  const { getPopupProps } = usePopoverPopup({
    getProps: getRootPopupProps,
    titleId,
    descriptionId,
  });

  const ownerState: PopoverPopup.OwnerState = React.useMemo(
    () => ({
      open,
      side,
      alignment,
      instant: instantType,
      entering: transitionStatus === 'entering',
      exiting: transitionStatus === 'exiting',
    }),
    [open, side, alignment, instantType, transitionStatus],
  );

  const mergedRef = useForkRef(popupRef, forwardedRef);

  const { renderElement } = useComponentRenderer({
    propGetter: getPopupProps,
    ref: mergedRef,
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: otherProps,
    customStyleHookMapping: {
      entering(value) {
        return value ? { 'data-entering': '' } : null;
      },
      exiting(value) {
        return value ? { 'data-exiting': '' } : null;
      },
      open(value) {
        return {
          'data-state': value ? 'open' : 'closed',
        };
      },
    },
  });

  return renderElement();
});

namespace PopoverPopup {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
    entering: boolean;
    exiting: boolean;
  }
  export interface Props extends BaseUIComponentProps<'div', OwnerState> {}
}

PopoverPopup.propTypes /* remove-proptypes */ = {
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
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PopoverPopup };
