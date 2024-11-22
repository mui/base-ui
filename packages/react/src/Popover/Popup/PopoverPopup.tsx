'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager } from '@floating-ui/react';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { usePopoverPositionerContext } from '../Positioner/PopoverPositionerContext';
import { usePopoverPopup } from './usePopoverPopup';
import { useForkRef } from '../../utils/useForkRef';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupOpenStateMapping as baseMapping } from '../../utils/popupOpenStateMapping';
import { InteractionType } from '../../utils/useEnhancedClickHandler';
import { refType } from '../../utils/proptypes';

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
 * - [Popover](https://base-ui.com/components/react-popover/)
 *
 * API:
 *
 * - [PopoverPopup API](https://base-ui.com/components/react-popover/#api-reference-PopoverPopup)
 */
const PopoverPopup = React.forwardRef(function PopoverPopup(
  props: PopoverPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, initialFocus, finalFocus, ...otherProps } = props;

  const {
    open,
    instantType,
    transitionStatus,
    getRootPopupProps,
    titleId,
    descriptionId,
    popupRef,
    mounted,
  } = usePopoverRootContext();
  const positioner = usePopoverPositionerContext();

  const { getPopupProps, resolvedInitialFocus } = usePopoverPopup({
    getProps: getRootPopupProps,
    titleId,
    descriptionId,
    initialFocus,
  });

  const ownerState: PopoverPopup.OwnerState = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      alignment: positioner.alignment,
      instant: instantType,
      transitionStatus,
    }),
    [open, positioner.side, positioner.alignment, instantType, transitionStatus],
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

  return (
    <FloatingFocusManager
      context={positioner.positionerContext}
      modal={false}
      disabled={!mounted}
      initialFocus={resolvedInitialFocus}
      returnFocus={finalFocus}
    >
      {renderElement()}
    </FloatingFocusManager>
  );
});

namespace PopoverPopup {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    /**
     * Determines an element to focus when the popover is opened.
     * It can be either a ref to the element or a function that returns such a ref.
     * If not provided, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
    /**
     * Determines an element to focus after the popover is closed.
     * If not provided, the focus returns to the trigger.
     */
    finalFocus?: React.RefObject<HTMLElement | null>;
  }
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
   * Determines an element to focus after the popover is closed.
   * If not provided, the focus returns to the trigger.
   */
  finalFocus: refType,
  /**
   * Determines an element to focus when the popover is opened.
   * It can be either a ref to the element or a function that returns such a ref.
   * If not provided, the first focusable element is focused.
   */
  initialFocus: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.func,
    refType,
  ]),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PopoverPopup };
