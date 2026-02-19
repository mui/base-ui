'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTriggerDataForwarding } from '../../utils/popups';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { TooltipHandle } from '../store/TooltipHandle';
import { useTooltipProviderContext } from '../provider/TooltipProviderContext';
import {
  safePolygon,
  useDelayGroup,
  useFocus,
  useHoverReferenceInteraction,
} from '../../floating-ui-react';
import { TooltipTriggerDataAttributes } from './TooltipTriggerDataAttributes';

import { OPEN_DELAY } from '../utils/constants';

/**
 * An element to attach the tooltip to.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tooltip](https://base-ui.com/react/components/tooltip)
 */
export const TooltipTrigger = fastComponentRef(function TooltipTrigger(
  componentProps: TooltipTrigger.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    className,
    render,
    handle,
    payload,
    disabled: disabledProp,
    delay,
    closeOnClick = true,
    closeDelay,
    id: idProp,
    ...elementProps
  } = componentProps;

  const rootContext = useTooltipRootContext(true);
  const store = handle?.store ?? rootContext;
  if (!store) {
    throw new Error(
      'Base UI: <Tooltip.Trigger> must be either used within a <Tooltip.Root> component or provided with a handle.',
    );
  }

  const thisTriggerId = useBaseUiId(idProp);
  const isTriggerActive = store.useState('isTriggerActive', thisTriggerId);
  const isOpenedByThisTrigger = store.useState('isOpenedByTrigger', thisTriggerId);
  const floatingRootContext = store.useState('floatingRootContext');

  const triggerElementRef = React.useRef<Element | null>(null);

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const { registerTrigger, isMountedByThisTrigger } = useTriggerDataForwarding(
    thisTriggerId,
    triggerElementRef,
    store,
    {
      payload,
      closeOnClick,
      closeDelay: closeDelayWithDefault,
    },
  );

  const providerContext = useTooltipProviderContext();
  const { delayRef, isInstantPhase, hasProvider } = useDelayGroup(floatingRootContext, {
    open: isOpenedByThisTrigger,
  });

  store.useSyncedValue('isInstantPhase', isInstantPhase);

  const rootDisabled = store.useState('disabled');
  const disabled = disabledProp ?? rootDisabled;
  const trackCursorAxis = store.useState('trackCursorAxis');
  const disableHoverablePopup = store.useState('disableHoverablePopup');

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
    triggerElementRef,
    isActiveTrigger: isTriggerActive,
  });

  const focusProps = useFocus(floatingRootContext, { enabled: !disabled }).reference;

  const state: TooltipTrigger.State = { open: isOpenedByThisTrigger };

  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, registerTrigger, triggerElementRef],
    props: [
      hoverProps,
      focusProps,
      rootTriggerProps,
      {
        onPointerDown() {
          store.set('closeOnClick', closeOnClick);
        },
        id: thisTriggerId,
        [TooltipTriggerDataAttributes.triggerDisabled]: disabled ? '' : undefined,
      } as React.HTMLAttributes<Element>,
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

export interface TooltipTriggerProps<Payload = unknown> extends BaseUIComponentProps<
  'button',
  TooltipTrigger.State
> {
  /**
   * A handle to associate the trigger with a tooltip.
   */
  handle?: TooltipHandle<Payload> | undefined;
  /**
   * A payload to pass to the tooltip when it is opened.
   */
  payload?: Payload | undefined;
  /**
   * How long to wait before opening the tooltip. Specified in milliseconds.
   * @default 600
   */
  delay?: number | undefined;
  /**
   * Whether the tooltip should close when this trigger is clicked.
   * @default true
   */
  closeOnClick?: boolean | undefined;
  /**
   * How long to wait before closing the tooltip. Specified in milliseconds.
   * @default 0
   */
  closeDelay?: number | undefined;
  /**
   * If `true`, the tooltip will not open when interacting with this trigger.
   * Note that this doesn't apply the `disabled` attribute to the trigger element.
   * If you want to disable the trigger element itself, you can pass the `disabled` prop to the trigger element via the `render` prop.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace TooltipTrigger {
  export type State = TooltipTriggerState;
  export type Props<Payload = unknown> = TooltipTriggerProps<Payload>;
}
