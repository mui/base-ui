'use client';
import * as React from 'react';
import { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { FloatingFocusManager } from '../../floating-ui-react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import type { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { DISABLED_TRANSITIONS_STYLE, EMPTY_OBJECT } from '../../utils/constants';

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
export const PopoverPopup = React.forwardRef(function PopoverPopup(
  componentProps: PopoverPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, initialFocus, finalFocus, ...elementProps } = componentProps;

  const {
    open,
    instantType,
    transitionStatus,
    popupProps,
    titleId,
    descriptionId,
    popupRef,
    mounted,
    openReason,
    onOpenChangeComplete,
    modal,
    openMethod,
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

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  const defaultInitialFocus = React.useCallback(
    (interactionType: InteractionType) => {
      if (interactionType === 'touch') {
        return popupRef.current;
      }
      return 0;
    },
    [popupRef],
  );

  const initialFocusProp = initialFocus === undefined ? defaultInitialFocus : initialFocus;

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

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, popupRef],
    props: [
      popupProps,
      {
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
      },
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT,
      elementProps,
    ],
    customStyleHookMapping,
  });

  return (
    <FloatingFocusManager
      context={positioner.context}
      openInteractionType={openMethod || ''}
      modal={modal === 'trap-focus'}
      disabled={!mounted || openReason === 'trigger-hover'}
      initialFocus={initialFocusProp}
      returnFocus={finalFocus}
      restoreFocus="popup"
    >
      {element}
    </FloatingFocusManager>
  );
});

export namespace PopoverPopup {
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
      | null
      | React.RefObject<HTMLElement | null>
      | ((interactionType: InteractionType) => HTMLElement | null | void);
    /**
     * Determines the element to focus when the popover is closed.
     * By default, focus returns to the trigger.
     */
    finalFocus?: null | React.RefObject<HTMLElement | null> | (() => HTMLElement | null | void);
  }
}
