'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { type FocusableElement } from 'tabbable';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { usePopoverRootContext } from '../root/PopoverRootContext';
import { useButton } from '../../use-button/useButton';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import {
  triggerOpenStateMapping,
  pressableTriggerOpenStateMapping,
} from '../../utils/popupStateMapping';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useRenderElement } from '../../utils/useRenderElement';
import { CLICK_TRIGGER_IDENTIFIER } from '../../utils/constants';
import { safePolygon, useClick, useHover, useInteractions } from '../../floating-ui-react';
import { OPEN_DELAY } from '../utils/constants';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import { PopoverStore } from '../store';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { FocusGuard } from '../../utils/FocusGuard';
import {
  contains,
  getNextTabbable,
  getTabbableAfterElement,
  getTabbableBeforeElement,
  isOutsideEvent,
} from '../../floating-ui-react/utils';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';

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
    id: idProp,
    ...elementProps
  } = componentProps;

  const rootContext = usePopoverRootContext(true);

  let store: PopoverStore<unknown>;

  if (handle) {
    store = handle;
  } else if (rootContext) {
    store = rootContext.store;
  } else {
    throw new Error(
      'Base UI: PopoverTrigger must be either used within a PopoverRoot component or have the `handle` prop set.',
    );
  }

  const id = useBaseUiId(idProp);

  const floatingContext = store.useState('floatingRootContext');
  const open = store.useState('open');
  const openReason = store.useState('openReason');
  const rootActiveTriggerProps = store.useState('activeTriggerProps');
  const rootInactiveTriggerProps = store.useState('inactiveTriggerProps');
  const stickIfOpen = store.useState('stickIfOpen');
  const mounted = store.useState('mounted');
  const activeTrigger = store.useState('activeTriggerElement');
  const positionerElement = store.useState('positionerElement');

  const [triggerElement, setTriggerElement] = React.useState<HTMLElement | null>(null);

  const isTriggerActive = activeTrigger === triggerElement;

  const {
    openMethod,
    triggerProps: interactionTypeTriggerProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(open);

  useIsoLayoutEffect(() => {
    store.set('openMethod', openMethod);
  }, [store, openMethod]);

  React.useEffect(() => {
    if (!mounted) {
      resetOpenInteractionType();
    }
  }, [mounted, resetOpenInteractionType]);

  const hover = useHover(floatingContext, {
    enabled:
      floatingContext != null &&
      openOnHover &&
      (openMethod !== 'touch' || openReason !== 'trigger-press'),
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
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

  const registeredId = React.useRef<string>(null);
  const registerTrigger = React.useCallback(
    (element: HTMLElement | null) => {
      if (id == null) {
        throw new Error('Base UI: PopoverTrigger must have an `id` prop specified.');
      }

      if (element != null) {
        store.registerTrigger(id, element, getPayload);
        setTriggerElement(element);
        // Keeping track of the registered id in case it changes.
        registeredId.current = id;
      } else {
        if (registeredId.current != null) {
          store.unregisterTrigger(registeredId.current);
          registeredId.current = null;
        }

        setTriggerElement(null);
      }
    },
    [getPayload, store, id],
  );

  const state: PopoverTrigger.State = React.useMemo(
    () => ({
      disabled,
      open: isTriggerActive && open,
    }),
    [disabled, open, isTriggerActive],
  );

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  const stateAttributesMapping: StateAttributesMapping<{ open: boolean }> = React.useMemo(
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
      isTriggerActive ? rootActiveTriggerProps : rootInactiveTriggerProps,
      interactionTypeTriggerProps,
      { [CLICK_TRIGGER_IDENTIFIER as string]: '', id, key: id },
      elementProps,
      getButtonProps,
    ],
    stateAttributesMapping,
  });

  const preFocusGuardRef = React.useRef<HTMLElement>(null);

  const handlePreFocusGuardFocus = useEventCallback((event: React.FocusEvent) => {
    ReactDOM.flushSync(() => {
      store.setOpen(
        false,
        createChangeEventDetails(
          'focus-out',
          event.nativeEvent,
          event.currentTarget as HTMLElement,
        ),
      );
    });

    const previousTabbable: FocusableElement | null = getTabbableBeforeElement(
      preFocusGuardRef.current,
    );
    previousTabbable?.focus();
  });

  const handleFocusTargetFocus = useEventCallback((event: React.FocusEvent) => {
    if (positionerElement && isOutsideEvent(event, positionerElement)) {
      store.context.beforeContentFocusGuardRef.current?.focus();
    } else {
      ReactDOM.flushSync(() => {
        store.setOpen(
          false,
          createChangeEventDetails(
            'focus-out',
            event.nativeEvent,
            event.currentTarget as HTMLElement,
          ),
        );
      });

      let nextTabbable = getTabbableAfterElement(triggerElement);

      while (
        (nextTabbable !== null && contains(positionerElement, nextTabbable)) ||
        nextTabbable?.hasAttribute('aria-hidden')
      ) {
        const prevTabbable = nextTabbable;
        nextTabbable = getNextTabbable(nextTabbable);
        if (nextTabbable === prevTabbable) {
          break;
        }
      }

      nextTabbable?.focus();
    }
  });

  if (isTriggerActive) {
    return (
      <React.Fragment>
        <FocusGuard ref={preFocusGuardRef} onFocus={handlePreFocusGuardFocus} />
        {element}
        <FocusGuard ref={store.context.triggerFocusTargetRef} onFocus={handleFocusTargetFocus} />
      </React.Fragment>
    );
  }

  return element;
}) as ComponentType;

interface ComponentType {
  <Payload>(
    componentProps: PopoverTriggerProps<Payload> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export interface PopoverTriggerState {
  /**
   * Whether the popover is currently disabled.
   */
  disabled: boolean;
  /**
   * Whether the popover is currently open.
   */
  open: boolean;
}

export type PopoverTriggerProps<Payload = unknown> = NativeButtonProps &
  BaseUIComponentProps<'button', PopoverTriggerState> & {
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
    handle?: PopoverStore<Payload>;
    /**
     * A payload to pass to the popover when it is opened.
     */
    payload?: Payload;
    /**
     * ID of the trigger. In addition to being forwarded to the rendered element,
     * it is also used to specify the active trigger for the popover in controlled mode (with the PopoverRoot `triggerId` prop).
     */
    id?: string;
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

export namespace PopoverTrigger {
  export type State = PopoverTriggerState;
  export type Props<Payload = unknown> = PopoverTriggerProps<Payload>;
}
