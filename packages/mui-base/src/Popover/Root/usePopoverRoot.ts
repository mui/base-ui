import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  safePolygon,
  useClick,
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
  useRole,
  type OpenChangeReason,
  type FloatingRootContext,
} from '@floating-ui/react';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useAnimationsFinished } from '../../utils/useAnimationsFinished';
import { OPEN_DELAY } from '../utils/constants';
import type { GenericHTMLProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

export function usePopoverRoot(params: usePopoverRoot.Parameters): usePopoverRoot.ReturnValue {
  const {
    open: externalOpen,
    onOpenChange: onOpenChangeProp = () => {},
    defaultOpen = false,
    keepMounted = false,
    delayType = 'rest',
    delay,
    closeDelay,
    openOnHover = false,
    animated = true,
  } = params;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const [instantType, setInstantType] = React.useState<'dismiss' | 'click'>();
  const [titleId, setTitleId] = React.useState<string>();
  const [descriptionId, setDescriptionId] = React.useState<string>();
  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);

  const popupRef = React.useRef<HTMLElement>(null);

  const [open, setOpenUnwrapped] = useControlled({
    controlled: externalOpen,
    default: defaultOpen,
    name: 'Popover',
    state: 'open',
  });

  const onOpenChange = useEventCallback(onOpenChangeProp);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const runOnceAnimationsFinish = useAnimationsFinished(popupRef);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
      onOpenChange(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
      if (!keepMounted && !nextOpen) {
        if (animated) {
          runOnceAnimationsFinish(() => setMounted(false));
        } else {
          setMounted(false);
        }
      }
    },
  );

  const context = useFloatingRootContext({
    elements: { reference: triggerElement, floating: positionerElement },
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      const isHover = reasonValue === 'hover' || reasonValue === 'safe-polygon';
      const isKeyboardClick = reasonValue === 'click' && (eventValue as MouseEvent).detail === 0;
      const isDismissClose = !openValue && (reasonValue === 'escape-key' || reasonValue == null);

      function changeState() {
        setOpen(openValue, eventValue, reasonValue);
      }

      if (animated && isHover) {
        ReactDOM.flushSync(changeState);
      } else {
        changeState();
      }

      if (isKeyboardClick || isDismissClose) {
        setInstantType(isKeyboardClick ? 'click' : 'dismiss');
      } else {
        setInstantType(undefined);
      }
    },
  });

  const computedRestMs = delayType === 'rest' ? delayWithDefault : undefined;
  let computedOpenDelay: number | undefined = delayType === 'hover' ? delayWithDefault : undefined;

  if (delayType === 'hover') {
    computedOpenDelay = delay == null ? delayWithDefault : delay;
  }

  const hover = useHover(context, {
    enabled: openOnHover,
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    restMs: computedRestMs,
    delay: {
      open: computedOpenDelay,
      close: closeDelayWithDefault,
    },
  });
  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss, role]);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      mounted,
      setMounted,
      transitionStatus,
      triggerElement,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      popupRef,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
      getRootTriggerProps: getReferenceProps,
      getRootPopupProps: getFloatingProps,
      floatingRootContext: context,
      instantType,
    }),
    [
      mounted,
      open,
      setMounted,
      setOpen,
      transitionStatus,
      triggerElement,
      positionerElement,
      titleId,
      descriptionId,
      getReferenceProps,
      getFloatingProps,
      context,
      instantType,
    ],
  );
}

export namespace usePopoverRoot {
  export interface Parameters {
    /**
     * Whether the popover popup is open by default. Use when uncontrolled.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Whether the popover popup is open. Use when controlled.
     * @default false
     */
    open?: boolean;
    /**
     * Callback fired when the popover popup is requested to be opened or closed. Use when
     * controlled.
     */
    onOpenChange?: (isOpen: boolean, event?: Event, reason?: OpenChangeReason) => void;
    /**
     * Whether the popover popup opens when the trigger is hovered after the provided `delay`.
     * @default false
     */
    openOnHover?: boolean;
    /**
     * The delay in milliseconds until the popover popup is opened when `openOnHover` is `true`.
     * @default 300
     */
    delay?: number;
    /**
     * The delay in milliseconds until the popover popup is closed when `openOnHover` is `true`.
     * @default 0
     */
    closeDelay?: number;
    /**
     * The delay type to use when `openOnHover` is `true`. `rest` means the `delay` represents how
     * long the user's cursor must rest on the trigger before the popover popup is opened. `hover`
     * means the `delay` represents how long to wait as soon as the user's cursor has entered the
     * trigger.
     * @default 'rest'
     */
    delayType?: 'rest' | 'hover';
    /**
     * Whether the popover popup element stays mounted in the DOM when closed.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * Whether the popover can animate, adding animation-related attributes and allowing for exit
     * animations to play. Useful to disable in tests to remove async behavior.
     * @default true
     */
    animated?: boolean;
  }

  export interface ReturnValue {
    open: boolean;
    setOpen: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
    mounted: boolean;
    setMounted: React.Dispatch<React.SetStateAction<boolean>>;
    transitionStatus: TransitionStatus;
    titleId: string | undefined;
    setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
    descriptionId: string | undefined;
    setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
    floatingRootContext: FloatingRootContext;
    getRootTriggerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    instantType: 'dismiss' | 'click' | undefined;
    triggerElement: Element | null;
    setTriggerElement: React.Dispatch<React.SetStateAction<Element | null>>;
    positionerElement: HTMLElement | null;
    setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    popupRef: React.RefObject<HTMLElement | null>;
  }
}
