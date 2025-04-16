'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager } from '@floating-ui/react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import { usePopoverPopup } from './usePopoverPopup';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { InteractionType } from '../../utils/useEnhancedClickHandler';
import { refType } from '../../utils/proptypes';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';

const customStyleHookMapping: CustomStyleHookMapping<PopoverPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the popover contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
const PopoverPopup = React.forwardRef(function PopoverPopup(
  componentProps: PopoverPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, initialFocus, finalFocus, ...elementProps } = componentProps;

  const {
    open,
    instantType,
    transitionStatus,
    getPopupProps,
    titleId,
    descriptionId,
    popupRef,
    mounted,
    openReason,
    onOpenChangeComplete,
    modal,
  } = usePopoverRootContext();
  const positioner = usePopoverPositionerContext();

  useOpenChangeComplete({
    open,
    ref: popupRef,
    onComplete() {
      if (open) {
        onOpenChangeComplete?.(true);
      }
    },
  });

  const { props, resolvedInitialFocus } = usePopoverPopup({
    titleId,
    descriptionId,
    initialFocus,
  });

  const state: PopoverPopup.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      instant: instantType,
      transitionStatus,
    }),
    [open, positioner.side, positioner.align, instantType, transitionStatus],
  );

  const renderElement = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, popupRef],
    props: [
      props,
      getPopupProps,
      {
        style: transitionStatus === 'starting' ? { transition: 'none' } : {},
      },
      elementProps,
    ],
    customStyleHookMapping,
  });

  return (
    <FloatingFocusManager
      context={positioner.context}
      modal={modal !== false}
      disabled={!mounted || openReason === 'hover'}
      initialFocus={resolvedInitialFocus}
      returnFocus={finalFocus}
    >
      {renderElement()}
    </FloatingFocusManager>
  );
});

namespace PopoverPopup {
  export interface State {
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
    side: Side;
    align: Align;
    transitionStatus: TransitionStatus;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Determines the element to focus when the popover is opened.
     * By default, the first focusable element is focused.
     */
    initialFocus?:
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => React.RefObject<HTMLElement | null>);
    /**
     * Determines the element to focus when the popover is closed.
     * By default, focus returns to the trigger.
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
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Determines the element to focus when the popover is closed.
   * By default, focus returns to the trigger.
   */
  finalFocus: refType,
  /**
   * Determines the element to focus when the popover is opened.
   * By default, the first focusable element is focused.
   */
  initialFocus: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.func,
    refType,
  ]),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

export { PopoverPopup };
