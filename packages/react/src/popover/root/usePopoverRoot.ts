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
  type FloatingRootContext,
} from '@floating-ui/react';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { OPEN_DELAY } from '../utils/constants';
import type { GenericHTMLProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';
import { type InteractionType } from '../../utils/useEnhancedClickHandler';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import {
  translateOpenChangeReason,
  type OpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { useAfterExitAnimation } from '../../utils/useAfterExitAnimation';

export function usePopoverRoot(params: usePopoverRoot.Parameters): usePopoverRoot.ReturnValue {
  const {
    open: externalOpen,
    onOpenChange: onOpenChangeProp = () => {},
    defaultOpen = false,
    delay,
    closeDelay,
    openOnHover = false,
  } = params;

  const delayWithDefault = delay ?? OPEN_DELAY;
  const closeDelayWithDefault = closeDelay ?? 0;

  const [instantType, setInstantType] = React.useState<'dismiss' | 'click'>();
  const [titleId, setTitleId] = React.useState<string>();
  const [descriptionId, setDescriptionId] = React.useState<string>();
  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [openReason, setOpenReason] = React.useState<OpenChangeReason | null>(null);

  const popupRef = React.useRef<HTMLElement>(null);

  const [open, setOpenUnwrapped] = useControlled({
    controlled: externalOpen,
    default: defaultOpen,
    name: 'Popover',
    state: 'open',
  });

  const onOpenChange = useEventCallback(onOpenChangeProp);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const setOpen = useEventCallback(
    (nextOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
      onOpenChange(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);

      if (nextOpen) {
        setOpenReason(reason ?? null);
      }
    },
  );

  useAfterExitAnimation({
    open,
    animatedElementRef: popupRef,
    onFinished: () => {
      setMounted(false);
      setOpenReason(null);
    },
  });

  const context = useFloatingRootContext({
    elements: { reference: triggerElement, floating: positionerElement },
    open,
    onOpenChange(openValue, eventValue, reasonValue) {
      const isHover = reasonValue === 'hover' || reasonValue === 'safe-polygon';
      const isKeyboardClick = reasonValue === 'click' && (eventValue as MouseEvent).detail === 0;
      const isDismissClose = !openValue && (reasonValue === 'escape-key' || reasonValue == null);

      function changeState() {
        setOpen(openValue, eventValue, translateOpenChangeReason(reasonValue));
      }

      if (isHover) {
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

  const computedRestMs = delayWithDefault;

  const hover = useHover(context, {
    enabled: openOnHover,
    mouseOnly: true,
    move: false,
    handleClose: safePolygon(),
    restMs: computedRestMs,
    delay: {
      close: closeDelayWithDefault,
    },
  });
  const click = useClick(context, { stickIfOpen: false });
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss, role]);

  const { openMethod, triggerProps } = useOpenInteractionType(open);
  return React.useMemo(
    () => ({
      open,
      setOpen,
      mounted,
      setMounted,
      transitionStatus,
      setTriggerElement,
      positionerElement,
      setPositionerElement,
      popupRef,
      titleId,
      setTitleId,
      descriptionId,
      setDescriptionId,
      getRootTriggerProps: (externalProps?: React.HTMLProps<Element>) =>
        getReferenceProps(mergeReactProps(externalProps, triggerProps)),
      getRootPopupProps: getFloatingProps,
      floatingRootContext: context,
      instantType,
      openMethod,
      openReason,
    }),
    [
      mounted,
      open,
      setMounted,
      setOpen,
      transitionStatus,
      positionerElement,
      titleId,
      descriptionId,
      getReferenceProps,
      getFloatingProps,
      context,
      instantType,
      openMethod,
      triggerProps,
      openReason,
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
    onOpenChange?: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
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
    setTriggerElement: React.Dispatch<React.SetStateAction<Element | null>>;
    positionerElement: HTMLElement | null;
    setPositionerElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    popupRef: React.RefObject<HTMLElement | null>;
    openMethod: InteractionType | null;
    openReason: OpenChangeReason | null;
  }
}
