'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { type FocusableElement } from 'tabbable';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
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
import { PopoverHandle } from '../store/PopoverHandle';
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
import { REASONS } from '../../utils/reasons';
import { useTriggerRegistration } from '../../utils/popupStoreUtils';

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

  const store = handle?.store ?? rootContext?.store;
  if (!store) {
    throw new Error(
      'Base UI: <Popover.Trigger> must be either used within a <Popover.Root> component or provided with a handle.',
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
      (openMethod !== 'touch' || openReason !== REASONS.triggerPress),
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

  const registerTrigger = useTriggerRegistration(id, store);

  useIsoLayoutEffect(() => {
    if (isTriggerActive) {
      store.set('payload', payload);
    }
  }, [isTriggerActive, payload, store]);

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
        if (value && openReason === REASONS.triggerPress) {
          return pressableTriggerOpenStateMapping.open(value);
        }

        return triggerOpenStateMapping.open(value);
      },
    }),
    [openReason],
  );

  const element = useRenderElement('button', componentProps, {
    state,
    ref: [buttonRef, forwardedRef, registerTrigger, setTriggerElement],
    props: [
      localProps.getReferenceProps(),
      isTriggerActive ? rootActiveTriggerProps : rootInactiveTriggerProps,
      interactionTypeTriggerProps,
      { [CLICK_TRIGGER_IDENTIFIER as string]: '', id },
      elementProps,
      getButtonProps,
    ],
    stateAttributesMapping,
  });

  const preFocusGuardRef = React.useRef<HTMLElement>(null);

  const handlePreFocusGuardFocus = useStableCallback((event: React.FocusEvent) => {
    ReactDOM.flushSync(() => {
      store.setOpen(
        false,
        createChangeEventDetails(
          REASONS.focusOut,
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

  const handleFocusTargetFocus = useStableCallback((event: React.FocusEvent) => {
    if (positionerElement && isOutsideEvent(event, positionerElement)) {
      store.context.beforeContentFocusGuardRef.current?.focus();
    } else {
      ReactDOM.flushSync(() => {
        store.setOpen(
          false,
          createChangeEventDetails(
            REASONS.focusOut,
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

  // A fragment with key is required to ensure that the `element` is mounted to the same DOM node
  // regardless of whether the focus guards are rendered or not.

  if (isTriggerActive) {
    return (
      <React.Fragment>
        <FocusGuard ref={preFocusGuardRef} onFocus={handlePreFocusGuardFocus} />
        <React.Fragment key={id}>{element}</React.Fragment>
        <FocusGuard ref={store.context.triggerFocusTargetRef} onFocus={handleFocusTargetFocus} />
      </React.Fragment>
    );
  }

  return <React.Fragment key={id}>{element}</React.Fragment>;
}) as PopoverTrigger;

export interface PopoverTrigger {
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
    handle?: PopoverHandle<Payload>;
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
