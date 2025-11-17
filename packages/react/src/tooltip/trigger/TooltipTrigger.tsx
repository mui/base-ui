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
import { safePolygon, useDelayGroup, useHover, useInteractions } from '../../floating-ui-react';

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

  const open = store.useState('open');
  const rootActiveTriggerProps = store.useState('activeTriggerProps');
  const rootInactiveTriggerProps = store.useState('inactiveTriggerProps');
  const activeTrigger = store.useState('activeTriggerElement');
  const floatingRootContext = store.useState('floatingRootContext');
  const disabled = disabledProp ?? store.useState('disabled');
  const disableHoverablePopup = store.useState('disableHoverablePopup');
  const trackCursorAxis = store.useState('trackCursorAxis');

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const isTriggerActive = activeTrigger === triggerElement;

  const providerContext = useTooltipProviderContext();
  const { delayRef, isInstantPhase, hasProvider } = useDelayGroup(floatingRootContext);
  store.useSyncedValue('isInstantPhase', isInstantPhase);

  const hover = useHover(floatingRootContext, {
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
  });

  const interactionProps = useInteractions([hover]);

  const id = useBaseUiId(idProp);
  const registerTrigger = useTriggerRegistration(id, store);

  useIsoLayoutEffect(() => {
    if (isTriggerActive) {
      store.set('payload', payload);
    }
  }, [isTriggerActive, payload, store]);

  const state: TooltipTrigger.State = React.useMemo(
    () => ({ open: isTriggerActive && open }),
    [open, isTriggerActive],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, registerTrigger, setTriggerElement],
    props: [
      interactionProps.getReferenceProps(),
      isTriggerActive ? rootActiveTriggerProps : rootInactiveTriggerProps,
      { id },
      elementProps,
    ],
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
