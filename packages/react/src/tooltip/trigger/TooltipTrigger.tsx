'use client';
import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useTooltipRootContext } from '../root/TooltipRootContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useRenderElement } from '../../internals/useRenderElement';
import { useTriggerDataForwarding } from '../../utils/popups';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { TooltipHandle } from '../store/TooltipHandle';
import { useTooltipProviderContext } from '../provider/TooltipProviderContext';
import {
  safePolygon,
  useDelayGroup,
  useFocus,
  useHoverReferenceInteraction,
} from '../../floating-ui-react';
import { closest, contains, getTarget } from '../../floating-ui-react/utils/element';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { TooltipTriggerDataAttributes } from './TooltipTriggerDataAttributes';

import { OPEN_DELAY } from '../utils/constants';

const ENABLED_TOOLTIP_TRIGGER_SELECTOR = `[${TooltipTriggerDataAttributes.tooltipTrigger}]:not([${TooltipTriggerDataAttributes.triggerDisabled}])`;

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
    render,
    className,
    style,
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
  const disabledRef = React.useRef(disabled);
  disabledRef.current = disabled;
  const trackCursorAxis = store.useState('trackCursorAxis');
  const disableHoverablePopup = store.useState('disableHoverablePopup');

  const isNestedTriggerHoveredRef = React.useRef(false);
  const nestedTriggerOpenTimeout = useTimeout();

  const getOpenDelay = useStableCallback(() => {
    const providerDelay = providerContext?.delay;
    const groupOpenValue = typeof delayRef.current === 'object' ? delayRef.current.open : undefined;

    let computedOpenDelay = delayWithDefault;
    if (hasProvider) {
      if (groupOpenValue !== 0) {
        computedOpenDelay = delay ?? providerDelay ?? delayWithDefault;
      } else {
        computedOpenDelay = 0;
      }
    }

    return computedOpenDelay;
  });

  // Detect whether an event target is inside an enabled nested tooltip trigger.
  const detectNestedTriggerHover = useStableCallback((target: EventTarget | null) => {
    const triggerEl = triggerElementRef.current;
    let nestedTriggerHovered = false;

    if (triggerEl && isElement(target)) {
      const nearestTrigger = closest(target as Element, ENABLED_TOOLTIP_TRIGGER_SELECTOR);
      if (nearestTrigger && nearestTrigger !== triggerEl && contains(triggerEl, nearestTrigger)) {
        nestedTriggerHovered = true;
      }
    }

    isNestedTriggerHoveredRef.current = nestedTriggerHovered;
    if (nestedTriggerHovered) {
      nestedTriggerOpenTimeout.clear();
    }
    return nestedTriggerHovered;
  });

  const clearNestedTriggerHover = useStableCallback(() => {
    isNestedTriggerHoveredRef.current = false;
    nestedTriggerOpenTimeout.clear();
  });

  const shouldOpen = useStableCallback(() => {
    return !isNestedTriggerHoveredRef.current;
  });

  const hoverProps = useHoverReferenceInteraction(floatingRootContext, {
    enabled: !disabled,
    mouseOnly: true,
    move: false,
    handleClose: !disableHoverablePopup && trackCursorAxis !== 'both' ? safePolygon() : null,
    restMs: getOpenDelay,
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
    isClosing: () => store.select('transitionStatus') === 'ending',
    shouldOpen,
  });

  const focusProps = useFocus(floatingRootContext, { enabled: !disabled }).reference;

  const handleNestedTriggerHover = useStableCallback((event: MouseEvent) => {
    const wasNestedTriggerHovered = isNestedTriggerHoveredRef.current;
    const nestedTriggerHovered = detectNestedTriggerHover(getTarget(event));
    const triggerEl = triggerElementRef.current as HTMLElement | null;

    if (
      nestedTriggerHovered &&
      store.select('open') &&
      store.select('lastOpenChangeReason') === REASONS.triggerHover
    ) {
      store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
      return;
    }

    if (
      wasNestedTriggerHovered &&
      !nestedTriggerHovered &&
      !disabledRef.current &&
      !store.select('open') &&
      triggerEl
    ) {
      const open = () => {
        if (!isNestedTriggerHoveredRef.current && !disabledRef.current && !store.select('open')) {
          store.setOpen(true, createChangeEventDetails(REASONS.triggerHover, event, triggerEl));
        }
      };
      const openDelay = getOpenDelay();

      // Moving off a nested trigger does not get another hover callback because
      // tooltips disable mousemove hover tracking, so reopen the parent here.
      if (openDelay === 0) {
        nestedTriggerOpenTimeout.clear();
        open();
      } else {
        nestedTriggerOpenTimeout.start(openDelay, open);
      }
    }
  });

  const rootTriggerProps = store.useState('triggerProps', isMountedByThisTrigger);

  const state: TooltipTriggerState = { open: isOpenedByThisTrigger };

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, registerTrigger, triggerElementRef],
    props: [
      hoverProps,
      focusProps,
      rootTriggerProps,
      {
        onMouseOver(event: React.MouseEvent) {
          handleNestedTriggerHover(event.nativeEvent);
        },
        onMouseLeave() {
          clearNestedTriggerHover();
        },
        onPointerDown() {
          store.set('closeOnClick', closeOnClick);
        },
        id: thisTriggerId,
        [TooltipTriggerDataAttributes.triggerDisabled]: disabled ? '' : undefined,
        [TooltipTriggerDataAttributes.tooltipTrigger]: '',
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
  TooltipTriggerState
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
