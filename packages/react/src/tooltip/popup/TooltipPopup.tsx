'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import { useTooltipPositionerContext } from '../positioner/TooltipPositionerContext';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Align, Side } from '../../utils/useAnchorPositioning';
import type { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { popupStateMapping as baseMapping } from '../../utils/popupStateMapping';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/stateAttributesMapping';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useRenderElement } from '../../utils/useRenderElement';
import { usePopupAutoResize } from '../../utils/usePopupAutoResize';
import { getDisabledMountTransitionStyles } from '../../utils/getDisabledMountTransitionStyles';
import { useHoverFloatingInteraction } from '../../floating-ui-react';
import { REASONS } from '../../utils/reasons';

const stateAttributesMapping: StateAttributesMapping<TooltipPopup.State> = {
  ...baseMapping,
  ...transitionStatusMapping,
};

/**
 * A container for the tooltip contents.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipPopup = React.forwardRef(function TooltipPopup(
  componentProps: TooltipPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const { store } = useTooltipRootContext();
  const { side, align } = useTooltipPositionerContext();

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const instantType = store.useState('instantType');
  const transitionStatus = store.useState('transitionStatus');
  const popupProps = store.useState('popupProps');
  const payload = store.useState('payload');
  const popupElement = store.useState('popupElement');
  const positionerElement = store.useState('positionerElement');
  const floatingContext = store.useState('floatingRootContext');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const isInstantPhase = store.useState('isInstantPhase');

  useOpenChangeComplete({
    open,
    ref: store.context.popupRef,
    onComplete() {
      if (open) {
        store.context.onOpenChangeComplete?.(true);
      }
    },
  });

  function handleMeasureLayout() {
    floatingContext.context.events.emit('measure-layout');
  }

  function handleMeasureLayoutComplete(
    previousDimensions: { width: number; height: number } | null,
    nextDimensions: { width: number; height: number },
  ) {
    floatingContext.context.events.emit('measure-layout-complete', {
      previousDimensions,
      nextDimensions,
    });
  }

  // If there's just one trigger, we can skip the auto-resize logic as
  // the popover will always be anchored to the same position.
  const autoresizeEnabled = () => store.context.triggerElements.size > 1;

  usePopupAutoResize({
    popupElement,
    positionerElement,
    mounted,
    content: payload,
    enabled: autoresizeEnabled,
    onMeasureLayout: handleMeasureLayout,
    onMeasureLayoutComplete: handleMeasureLayoutComplete,
  });

  const disabled = store.useState('disabled');
  const closeDelay = store.useState('closeDelay');

  useHoverFloatingInteraction(floatingContext, {
    enabled: !disabled,
    closeDelay,
  });

  // Animations should be instant in two cases:
  // 1) Opening during the provider's instant phase (adjacent tooltip opens instantly)
  // 2) Closing because another tooltip opened (reason === 'none')
  // Otherwise, allow the animation to play. In particular, do not disable animations
  // during the 'ending' phase unless it's due to a sibling opening.
  const previousInstantTypeRef = React.useRef<string | undefined | null>(null);
  useIsoLayoutEffect(() => {
    if (
      (transitionStatus === 'ending' && lastOpenChangeReason === REASONS.none) ||
      (transitionStatus !== 'ending' && isInstantPhase)
    ) {
      // Capture the current instant type so we can restore it later
      // and set to 'delay' to disable animations while moving from one trigger to another
      // within a delay group.
      if (instantType !== 'delay') {
        previousInstantTypeRef.current = instantType;
      }
      store.set('instantType', 'delay');
    } else if (previousInstantTypeRef.current !== null) {
      store.set('instantType', previousInstantTypeRef.current);
      previousInstantTypeRef.current = null;
    }
  }, [transitionStatus, isInstantPhase, lastOpenChangeReason, instantType, store]);

  const state: TooltipPopup.State = React.useMemo(
    () => ({
      open,
      side,
      align,
      instant: instantType,
      transitionStatus,
    }),
    [open, side, align, instantType, transitionStatus],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, store.context.popupRef, store.useStateSetter('popupElement')],
    props: [popupProps, getDisabledMountTransitionStyles(transitionStatus), elementProps],
    stateAttributesMapping,
  });

  return element;
});

export interface TooltipPopupState {
  /**
   * Whether the tooltip is currently open.
   */
  open: boolean;
  side: Side;
  align: Align;
  instant: 'delay' | 'focus' | 'dismiss' | undefined;
  transitionStatus: TransitionStatus;
}

export interface TooltipPopupProps extends BaseUIComponentProps<'div', TooltipPopup.State> {}

export namespace TooltipPopup {
  export type State = TooltipPopupState;
  export type Props = TooltipPopupProps;
}
