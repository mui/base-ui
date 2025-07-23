'use client';
import * as React from 'react';
import { useSelector } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useModernLayoutEffect } from '@base-ui-components/utils/useModernLayoutEffect';
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
import { selectors } from '../store';
import { PopoverHandle } from '../handle/createPopover';

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
    ...elementProps
  } = componentProps;

  const { store } = usePopoverRootContext();

  const open = useSelector(store, selectors.open);
  const openReason = useSelector(store, selectors.openReason);
  const triggerProps = useSelector(store, selectors.triggerProps);

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

  const setTriggerElement = React.useCallback(
    (element: HTMLElement | null) => {
      store.set('activeTriggerElement', element);
    },
    [store],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, setTriggerElement, forwardedRef],
    props: [triggerProps, elementProps, getButtonProps],
    customStyleHookMapping,
  });

  return element;
});

export const PopoverDetachedTrigger = React.forwardRef(function PopoverDetachedTrigger(
  componentProps: PopoverDetachedTrigger.Props,
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

  if (!handle) {
    throw new Error('PopoverDetachedTrigger requires a `handle` prop to be passed.');
  }

  const store = handle.store;

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);

  const getPayload = useEventCallback(() => {
    return payload;
  });

  const onMount = React.useCallback(
    (element: HTMLElement) => {
      handle.registerTrigger(element, getPayload);

      return () => {
        handle.unregisterTrigger(element);
      };
    },
    [handle, getPayload],
  );

  const floatingContext = useSelector(handle.store, selectors.floatingRootContext);

  const open = useSelector(store, selectors.open);
  const openReason = useSelector(store, selectors.openReason);

  const { openMethod, triggerProps: interactionTypeTriggerProps } = useOpenInteractionType(open);

  useModernLayoutEffect(() => {
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

  const click = useClick(floatingContext, { enabled: floatingContext != null, stickIfOpen: false });

  const localProps = useInteractions([click, hover]);

  const rootTriggerProps = useSelector(handle.store, selectors.triggerProps);

  const state: PopoverTrigger.State = React.useMemo(
    () => ({
      disabled,
      open: false,
    }),
    [disabled],
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const customStyleHookMapping: CustomStyleHookMapping<{ open: boolean }> = React.useMemo(
    () => ({
      open(value) {
        if (value) {
          return pressableTriggerOpenStateMapping.open(value);
        }

        return triggerOpenStateMapping.open(value);
      },
    }),
    [],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef, onMount, setTriggerElement],
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
});

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

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;

    handle?: PopoverHandle<unknown>;
    payload?: any;
  }
}

export namespace PopoverDetachedTrigger {
  export interface Props extends PopoverTrigger.Props {
    openOnHover?: boolean;
    delay?: number;
    closeDelay?: number;
  }
}
