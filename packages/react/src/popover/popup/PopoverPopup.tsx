'use client';
import * as React from 'react';
import { InteractionType } from '@base-ui-components/utils/useEnhancedClickHandler';
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
import { REASONS } from '../../utils/reasons';
import { usePopupAutoResize } from '../../utils/usePopupAutoResize';
import { DISABLED_TRANSITIONS_STYLE, EMPTY_OBJECT } from '../../utils/constants';
import { useDirection } from '../../direction-provider/DirectionContext';
import { COMPOSITE_KEYS } from '../../composite/composite';
import { useToolbarRootContext } from '../../toolbar/root/ToolbarRootContext';

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

  const { store } = usePopoverRootContext();

  const positioner = usePopoverPositionerContext();
  const insideToolbar = useToolbarRootContext(true) != null;
  const direction = useDirection();

  const open = store.useState('open');
  const openMethod = store.useState('openMethod');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');
  const titleId = store.useState('titleElementId');
  const descriptionId = store.useState('descriptionElementId');
  const modal = store.useState('modal');
  const mounted = store.useState('mounted');
  const openReason = store.useState('openReason');
  const popupElement = store.useState('popupElement');
  const triggers = store.useState('triggers');
  const payload = store.useState('payload');
  const positionerElement = store.useState('positionerElement');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const floatingContext = store.useState('floatingRootContext');

  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    },
  });

  // Default initial focus logic:
  // If opened by touch, focus the popup element to prevent the virtual keyboard from opening
  // (this is required for Android specifically as iOS handles this automatically).
  function defaultInitialFocus(interactionType: InteractionType) {
    if (interactionType === 'touch') {
      return store.context.popupRef.current;
    }
    return true;
  }

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

  function handleMeasureLayout() {
    floatingContext.events.emit('measure-layout');
  }

  function handleMeasureLayoutComplete(
    previousDimensions: Dimensions | null,
    nextDimensions: Dimensions,
  ) {
    floatingContext.events.emit('measure-layout-complete', {
      previousDimensions,
      nextDimensions,
    });
  }

  // If there's just one trigger, we can skip the auto-resize logic as
  // the popover will always be anchored to the same position.
  const autoresizeEnabled = triggers.size > 1;

  usePopupAutoResize({
    popupElement,
    positionerElement,
    mounted,
    content: payload,
    enabled: autoresizeEnabled,
    onMeasureLayout: handleMeasureLayout,
    onMeasureLayoutComplete: handleMeasureLayoutComplete,
  });

  const anchoringStyles: React.CSSProperties = React.useMemo(() => {
    if (!autoresizeEnabled) {
      return EMPTY_OBJECT;
    }

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

    return isOriginSide
      ? {
          position: 'absolute',
          [positioner.side === 'top' ? 'bottom' : 'top']: '0',
          [isPhysicalLeft ? 'right' : 'left']: '0',
        }
      : EMPTY_OBJECT;
  }, [positioner.side, direction, autoresizeEnabled]);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef, setPopupElement],
    props: [
      popupProps,
      {
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
        style: anchoringStyles,
        onKeyDown(event) {
          if (insideToolbar && COMPOSITE_KEYS.has(event.key)) {
            event.stopPropagation();
          }
        },
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
      disabled={!mounted || openReason === REASONS.triggerHover}
      initialFocus={resolvedInitialFocus}
      returnFocus={finalFocus}
      restoreFocus="popup"
      previousFocusableElement={activeTriggerElement}
      nextFocusableElement={store.context.triggerFocusTargetRef}
      beforeContentFocusGuardRef={store.context.beforeContentFocusGuardRef}
    >
      {element}
    </FloatingFocusManager>
  );
});

export interface PopoverPopupState {
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
  side: Side;
  align: Align;
  transitionStatus: TransitionStatus;
}

export interface PopoverPopupProps extends BaseUIComponentProps<'div', PopoverPopup.State> {
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

export namespace PopoverPopup {
  export type State = PopoverPopupState;
  export type Props = PopoverPopupProps;
}
