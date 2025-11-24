'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTriggerRegistration } from '../../utils/popupStoreUtils';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { TooltipHandle } from '../store/TooltipHandle';
import { useTooltipProviderContext } from '../provider/TooltipProviderContext';
import { safePolygon, useDelayGroup, useHoverReferenceInteraction } from '../../floating-ui-react';

import { OPEN_DELAY } from '../utils/constants';

/**
 * An element to attach the tooltip to.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipTrigger = React.forwardRef(function TooltipTrigger(
  componentProps: TooltipTrigger.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const {
    className,
    render,
    handle,
    payload,
    disabled: disabledProp,
    delay,
    closeDelay,
    id: idProp,
    ...elementProps
  } = componentProps;

  const rootContext = useTooltipRootContext(true);
  const store = handle?.store ?? rootContext?.store;
  if (!store) {
    throw new Error(
      'Base UI: <Tooltip.Trigger> must be either used within a <Tooltip.Root> component or provided with a handle.',
    );
  }

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const thisTriggerId = useBaseUiId(idProp);

  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const rootTriggerProps = store.useState('triggerProps', isOpenedByThisTrigger);
  const floatingRootContext = store.useState('floatingRootContext');
  const disabled = disabledProp ?? store.useState('disabled');
  const disableHoverablePopup = store.useState('disableHoverablePopup');
  const trackCursorAxis = store.useState('trackCursorAxis');

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);

  const providerContext = useTooltipProviderContext();
  const { delayRef, isInstantPhase, hasProvider } = useDelayGroup(floatingRootContext, {
    open: isOpenedByThisTrigger,
  });

  store.useSyncedValue('isInstantPhase', isInstantPhase);

  const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
    enabled: !disabled,
    mouseOnly: true,
    move: false,
    handleClose: !disableHoverablePopup && trackCursorAxis !== 'both' ? safePolygon() : null,
    restMs() {
      const providerDelay = providerContext?.delay;
      const groupOpenValue =
        typeof delayRef.current === 'object' ? delayRef.current.open : undefined;

      let computedRestMs = delayWithDefault;
      if (hasProvider) {
        if (groupOpenValue !== 0) {
          computedRestMs = delay ?? providerDelay ?? delayWithDefault;
        } else {
          computedRestMs = 0;
        }
      }

      return computedRestMs;
    },
    delay() {
      const closeValue = typeof delayRef.current === 'object' ? delayRef.current.close : undefined;

      let computedCloseDelay: number | undefined = closeDelayWithDefault;
      if (closeDelay == null && hasProvider) {
        computedCloseDelay = closeValue;
      }

      return {
        close: computedCloseDelay,
      };
    },
    triggerElement,
    isActiveTrigger: isTriggerActive,
  });

  const baseRegisterTrigger = useTriggerRegistration(thisTriggerId, store);

  const registerTrigger = React.useCallback(
    (element: Element | null) => {
      const cleanup = baseRegisterTrigger(element);

      // If the tooltip is open, but there's no associated trigger, set this trigger as active.
      // This will set the first (in terms of DOM order) trigger as active when the tooltip
      // is opened programmatically and won't run for subsequent triggers.
      if (element !== null && store.select('open') && store.select('activeTriggerId') == null) {
        store.update({
          activeTriggerId: thisTriggerId,
          activeTriggerElement: element as HTMLElement,
          payload,
          closeDelay: closeDelayWithDefault,
        });
      }

      return cleanup;
    },
    [baseRegisterTrigger, closeDelayWithDefault, payload, store, thisTriggerId],
  );

  useIsoLayoutEffect(() => {
    if (isTriggerActive) {
      store.update({
        payload,
        closeDelay: closeDelayWithDefault,
        // TODO: rethink which component should set this
        activeTriggerElement: triggerElement,
      });
    }
  }, [isTriggerActive, payload, closeDelayWithDefault, triggerElement, store]);

  const state: TooltipTrigger.State = React.useMemo(
    () => ({ open: isOpenedByThisTrigger }),
    [isOpenedByThisTrigger],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, registerTrigger, setTriggerElement],
    props: [hoverProps, rootTriggerProps, { id: thisTriggerId }, elementProps],
    stateAttributesMapping: triggerOpenStateMapping,
  });

  return element;
}) as TooltipTrigger;

export interface TooltipTrigger {
  <Payload>(
    componentProps: TooltipTrigger.Props<Payload> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export interface TooltipTriggerState {
  /**
   * Whether the tooltip is currently open.
   */
  open: boolean;
}

export interface TooltipTriggerProps<Payload = unknown>
  extends BaseUIComponentProps<'button', TooltipTrigger.State> {
  /**
   * A handle to associate the trigger with a tooltip.
   */
  handle?: TooltipHandle<Payload>;
  /**
   * A payload to pass to the tooltip when it is opened.
   */
  payload?: Payload;
  /**
   * How long to wait before opening the tooltip. Specified in milliseconds.
   * @default 600
   */
  delay?: number;
  /**
   * How long to wait before closing the tooltip. Specified in milliseconds.
   * @default 0
   */
  closeDelay?: number;
}

export namespace TooltipTrigger {
  export type State = TooltipTriggerState;
  export type Props<Payload = unknown> = TooltipTriggerProps<Payload>;
}
