'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { usePopoverRootContext } from '../Root/PopoverRootContext.js';
import { useComponentRenderer } from '../../utils/useComponentRenderer.js';
import { usePopoverPositionerContext } from '../Positioner/PopoverPositionerContext.js';
import { usePopoverPopup } from './usePopoverPopup.js';
import { useForkRef } from '../../utils/useForkRef.js';
import type { Side, Alignment } from '../../utils/useAnchorPositioning.js';
import type { BaseUIComponentProps } from '../../utils/types.js';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps.js';
import type { TransitionStatus } from '../../utils/useTransitionStatus.js';
import { popupOpenStateMapping as baseMapping } from '../../utils/popupOpenStateMapping.js';

const customStyleHookMapping: CustomStyleHookMapping<PopoverPopup.OwnerState> = {
  ...baseMapping,
  transitionStatus(value) {
    if (value === 'entering') {
      return { 'data-entering': '' } as Record<string, string>;
    }
    if (value === 'exiting') {
      return { 'data-exiting': '' };
    }
    return null;
  },
};

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
      transitionStatus,
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
    customStyleHookMapping,
  });

  return renderElement();
});

namespace PopoverPopup {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
    transitionStatus: TransitionStatus;
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
