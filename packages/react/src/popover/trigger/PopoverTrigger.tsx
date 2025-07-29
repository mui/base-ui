'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useButton } from '../../use-button/useButton';
import type { BaseUIComponentProps } from '../../utils/types';
import {
  triggerOpenStateMapping,
  pressableTriggerOpenStateMapping,
} from '../../utils/popupStateMapping';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useRenderElement } from '../../utils/useRenderElement';
import { safePolygon, useClick, useHover, useInteractions } from '../../floating-ui-react';
import { OPEN_DELAY } from '../utils/constants';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { PopoverStore, selectors } from '../store';
import { PopoverHandle } from '../handle/PopoverHandle';

/**
 * A button that opens the popover.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverTrigger = React.forwardRef(function PopoverTrigger(
  componentProps: PopoverTrigger.Props,
  forwardedRef: React.ForwardedRef<any>,
) {
  const {
    render,
    className,
    disabled = false,
    nativeButton = true,
    handle,
    payload,
    openOnHover = false,
    delay = OPEN_DELAY,
    closeDelay = 0,
    ...elementProps
  } = componentProps;

  const rootContext = usePopoverRootContext(true);

  let store: PopoverStore;

  if (handle) {
    store = handle.store;
  } else if (rootContext) {
    store = rootContext.store;
  } else {
    throw new Error(
      'Base UI: PopoverTrigger must be either used within a PopoverRoot component or have the `handle` prop set.',
    );
  }

  const floatingContext = useStore(store, selectors.floatingRootContext);
  const open = useStore(store, selectors.open);
  const openReason = useStore(store, selectors.openReason);
  const rootTriggerProps = useStore(store, selectors.triggerProps);
  const stickIfOpen = useStore(store, selectors.stickIfOpen);

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);
  const { openMethod, triggerProps: interactionTypeTriggerProps } = useOpenInteractionType(open);

  useIsoLayoutEffect(() => {
    store.set('openMethod', openMethod);
  }, [store, openMethod]);

  const hover = useHover(floatingContext, {
    enabled:
      floatingContext != null &&
      openOnHover &&
      (openMethod !== 'touch' || openReason !== 'trigger-press'),
    mouseOnly: true,
    move: false,
    handleClose: safePolygon({ blockPointerEvents: true }),
    restMs: delay,
    delay: {
      close: closeDelay,
    },
    triggerElement,
  });

  const click = useClick(floatingContext, { enabled: floatingContext != null, stickIfOpen });

  const localProps = useInteractions([click, hover]);

  const getPayload = useEventCallback(() => {
    return payload;
  });

  const registerTrigger = React.useCallback(
    (element: HTMLElement) => {
      store.set('activeTriggerElement', element);
      setTriggerElement(element);

      if (handle) {
        handle.registerTrigger(element, getPayload);
      }

      return () => {
        store.set('activeTriggerElement', null);
        setTriggerElement(null);

        if (handle) {
          handle.unregisterTrigger(element);
        }
      };
    },
    [handle, getPayload, store],
  );

  const state: PopoverTrigger.State = React.useMemo(
    () => ({
      disabled,
      open,
    }),
    [disabled, open],
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const customStyleHookMapping: CustomStyleHookMapping<{ open: boolean }> = React.useMemo(
    () => ({
      open(value) {
        if (value && openReason === 'trigger-press') {
          return pressableTriggerOpenStateMapping.open(value);
        }

        return triggerOpenStateMapping.open(value);
      },
    }),
    [openReason],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef, registerTrigger],
    props: [
      localProps.getReferenceProps(),
      rootTriggerProps,
      interactionTypeTriggerProps,
      elementProps,
      getButtonProps,
    ],
    customStyleHookMapping,
  });

  return element;
}) as PopoverTrigger.ComponentType;

export namespace PopoverTrigger {
  export interface State {
    /**
     * Whether the popover is currently disabled.
     */
    disabled: boolean;
    /**
     * Whether the popover is currently open.
     */
    open: boolean;
  }

  export type Props<Payload = unknown> = BaseUIComponentProps<'button', State> & {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
    /**
     * A handle to associate the trigger with a popover.
     */
    handle?: PopoverHandle<Payload>;
    /**
     * A payload to pass to the popover when it is opened.
     */
    payload?: Payload;
    /**
     * Whether the popover should also open when the trigger is hovered.
     * @default false
     */
    openOnHover?: boolean;
    /**
     * How long to wait before the popover may be opened on hover. Specified in milliseconds.
     *
     * Requires the `openOnHover` prop.
     * @default 300
     */
    delay?: number;
    /**
     * How long to wait before closing the popover that was opened on hover.
     * Specified in milliseconds.
     *
     * Requires the `openOnHover` prop.
     * @default 0
     */
    closeDelay?: number;
  };

  export interface ComponentType {
    <Payload>(
      componentProps: PopoverTrigger.Props<Payload> & React.RefAttributes<HTMLElement>,
    ): React.JSX.Element;
  }
}
