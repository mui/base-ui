'use client';
import * as React from 'react';
import { useSelector } from '@base-ui-components/utils/store';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useButton } from '../../use-button/useButton';
import type { BaseUIComponentProps } from '../../utils/types';
import {
  triggerOpenStateMapping,
  pressableTriggerOpenStateMapping,
} from '../../utils/popupStateMapping';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useRenderElement } from '../../utils/useRenderElement';
import { PopupHandle, selectors } from '../../utils/createPopup';

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

  const { open, setTriggerElement, triggerProps, openReason } = usePopoverRootContext();

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
    ref: [buttonRef, setTriggerElement, forwardedRef],
    props: [triggerProps, elementProps, getButtonProps],
    customStyleHookMapping,
  });

  return element;
});

export const PopoverDetachedTrigger = React.forwardRef(function PopoverDetachedTrigger(
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

  if (!handle) {
    throw new Error('PopoverDetachedTrigger requires a `handle` prop to be passed.');
  }

  const onMount = React.useCallback(
    (element: HTMLElement) => {
      handle.registerTrigger(element);

      return () => {
        handle.unregisterTrigger(element);
      };
    },
    [handle],
  );

  const triggerProps = useSelector(handle.store, selectors.triggerProps) ?? {};

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
    ref: [buttonRef, forwardedRef, onMount],
    props: [triggerProps, elementProps, getButtonProps],
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

    handle?: PopupHandle<unknown>;
    payload?: any;
  }
}
