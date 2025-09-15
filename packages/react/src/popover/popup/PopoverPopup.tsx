'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { Dimensions, FloatingFocusManager } from '../../floating-ui-react';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { usePopoverPositionerContext } from '../positioner/PopoverPositionerContext';
import type { Side, Align } from '../../utils/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../utils/types';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { usePopupAutoResize } from '../../utils/usePopupAutoResize';

import { DISABLED_TRANSITIONS_STYLE, EMPTY_OBJECT } from '../../utils/constants';
import { selectors } from '../store';
import { useDirection } from '../../direction-provider/DirectionContext';

const stateAttributesMapping: StateAttributesMapping<PopoverPopup.State> = {
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

  const { popupRef, onOpenChangeComplete, store } = usePopoverRootContext();

  const positioner = usePopoverPositionerContext();
  const direction = useDirection();

  const open = useStore(store, selectors.open);
  const openMethod = useStore(store, selectors.openMethod);
  const instantType = useStore(store, selectors.instantType);
  const transitionStatus = useStore(store, selectors.transitionStatus);
  const popupProps = useStore(store, selectors.popupProps);
  const titleId = useStore(store, selectors.titleId);
  const descriptionId = useStore(store, selectors.descriptionId);
  const modal = useStore(store, selectors.modal);
  const mounted = useStore(store, selectors.mounted);
  const openReason = useStore(store, selectors.openReason);
  const popupElement = useStore(store, selectors.popupElement);
  const triggers = useStore(store, selectors.triggers);
  const payload = useStore(store, selectors.payload);
  const positionerElement = useStore(store, selectors.positionerElement);
  const floatingContext = useStore(store, selectors.floatingRootContext);

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
  const defaultInitialFocus = useEventCallback((interactionType: InteractionType) => {
    if (interactionType === 'touch') {
      return popupRef.current;
    }
    return true;
  });

  const resolvedInitialFocus = initialFocus === undefined ? defaultInitialFocus : initialFocus;

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

  const setPopupElement = React.useCallback(
    (element: HTMLElement | null) => {
      store.set('popupElement', element);
    },
    [store],
  );

  const handleMeasureLayout = useEventCallback(() => {
    floatingContext.events.emit('measure-layout');
  });

  const handleMeasureLayoutComplete = useEventCallback(
    (previousDimensions: Dimensions | null, nextDimensions: Dimensions) => {
      floatingContext.events.emit('measure-layout-complete', {
        previousDimensions,
        nextDimensions,
      });
    },
  );

  usePopupAutoResize({
    popupElement,
    positionerElement,
    open,
    content: payload,
    enabled: triggers.size > 1,
    onMeasureLayout: handleMeasureLayout,
    onMeasureLayoutComplete: handleMeasureLayoutComplete,
  });

  // Ensure popup size transitions correctly when anchored to `bottom` (side=top) or `right` (side=left).
  let isOriginSide = positioner.side === 'top';
  let isPhysicalLeft = positioner.side === 'left';
  if (direction === 'rtl') {
    isOriginSide = isOriginSide || positioner.side === 'inline-end';
    isPhysicalLeft = isPhysicalLeft || positioner.side === 'inline-end';
  } else {
    isOriginSide = isOriginSide || positioner.side === 'inline-start';
    isPhysicalLeft = isPhysicalLeft || positioner.side === 'inline-start';
  }

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, popupRef, setPopupElement],
    props: [
      popupProps,
      {
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
        style: isOriginSide
          ? {
              position: 'absolute',
              [positioner.side === 'top' ? 'bottom' : 'top']: '0',
              [isPhysicalLeft ? 'right' : 'left']: '0',
            }
          : {},
      },
      transitionStatus === 'starting' ? DISABLED_TRANSITIONS_STYLE : EMPTY_OBJECT,
      elementProps,
    ],
    stateAttributesMapping,
  });

  return (
    <FloatingFocusManager
      context={positioner.context}
      openInteractionType={openMethod}
      modal={modal === 'trap-focus'}
      disabled={!mounted || openReason === 'trigger-hover'}
      initialFocus={resolvedInitialFocus}
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
     *
     * - `false`: Do not move focus.
     * - `true`: Move focus based on the default behavior (first tabbable element or popup).
     * - `RefObject`: Move focus to the ref element.
     * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
     *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
     */
    initialFocus?:
      | boolean
      | React.RefObject<HTMLElement | null>
      | ((openType: InteractionType) => void | boolean | HTMLElement | null);
    /**
     * Determines the element to focus when the popover is closed.
     *
     * - `false`: Do not move focus.
     * - `true`: Move focus based on the default behavior (trigger or previously focused element).
     * - `RefObject`: Move focus to the ref element.
     * - `function`: Called with the interaction type (`mouse`, `touch`, `pen`, or `keyboard`).
     *   Return an element to focus, `true` to use the default behavior, or `false`/`undefined` to do nothing.
     */
    finalFocus?:
      | boolean
      | React.RefObject<HTMLElement | null>
      | ((closeType: InteractionType) => void | boolean | HTMLElement | null);
  }
}
