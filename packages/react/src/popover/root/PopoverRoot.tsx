'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  safePolygon,
  useDismiss,
  useFloatingRootContext,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { useClick } from '../../utils/floating-ui/useClick';
import { useTimeout } from '../../utils/useTimeout';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { OPEN_DELAY } from '../utils/constants';
import { useOpenInteractionType } from '../../utils/useOpenInteractionType';
import {
  translateOpenChangeReason,
  BaseOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { PATIENT_CLICK_THRESHOLD } from '../../utils/constants';
import { useScrollLock } from '../../utils/useScrollLock';
import { PopoverRootContext } from './PopoverRootContext';

type PopoverOpenChangeReason = BaseOpenChangeReason | 'close-press';

/**
 * Groups all parts of the popover.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Popover](https://base-ui.com/react/components/popover)
 */
export const PopoverRoot: React.FC<PopoverRoot.Props> = function PopoverRoot(props) {
  const {
    open: externalOpen,
    onOpenChange,
    defaultOpen = false,
    delay = OPEN_DELAY,
    closeDelay = 0,
    openOnHover = false,
    onOpenChangeComplete,
    modal = false,
  } = props;

  const [instantType, setInstantType] = React.useState<'dismiss' | 'click'>();
  const [titleId, setTitleId] = React.useState<string>();
  const [descriptionId, setDescriptionId] = React.useState<string>();
  const [triggerElement, setTriggerElement] = React.useState<Element | null>(null);
  const [positionerElement, setPositionerElement] = React.useState<HTMLElement | null>(null);
  const [openReason, setOpenReason] = React.useState<PopoverOpenChangeReason | null>(null);
  const [stickIfOpen, setStickIfOpen] = React.useState(true);

  const popupRef = React.useRef<HTMLElement>(null);
  const stickIfOpenTimeout = useTimeout();

  const [open, setOpenUnwrapped] = useControlled({
    controlled: externalOpen,
    default: defaultOpen,
    name: 'Popover',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  useScrollLock({
    enabled: open && modal === true && openReason !== 'trigger-hover',
    mounted,
    open,
    referenceElement: positionerElement,
  });

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: PopoverOpenChangeReason | undefined) => {
      onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);

      if (nextOpen) {
        setOpenReason(reason ?? null);
      }
    },
  );

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    setStickIfOpen(true);
    setOpenReason(null);
    onOpenChangeComplete?.(false);
  });

  useOpenChangeComplete({
    enabled: !props.actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(props.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  React.useEffect(() => {
    if (!open) {
      stickIfOpenTimeout.clear();
    }
  }, [stickIfOpenTimeout, open]);

  const floatingContext = useFloatingRootContext({
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
        // Only allow "patient" clicks to close the popover if it's open.
        // If they clicked within 500ms of the popover opening, keep it open.
        setStickIfOpen(true);
        stickIfOpenTimeout.start(PATIENT_CLICK_THRESHOLD, () => {
          setStickIfOpen(false);
        });

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

  const { openMethod, triggerProps } = useOpenInteractionType(open);

  const computedRestMs = delay;

  const hover = useHover(floatingContext, {
    enabled: openOnHover && (openMethod !== 'touch' || openReason !== 'trigger-press'),
    mouseOnly: true,
    move: false,
    handleClose: safePolygon({ blockPointerEvents: true }),
    restMs: computedRestMs,
    delay: {
      close: closeDelay,
    },
  });
  const click = useClick(floatingContext, { stickIfOpen });
  const dismiss = useDismiss(floatingContext);
  const role = useRole(floatingContext);

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss, role]);

  const popoverContext = React.useMemo(
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
      triggerProps: getReferenceProps(triggerProps),
      popupProps: getFloatingProps(),
      floatingRootContext: floatingContext,
      instantType,
      openMethod,
      openReason,
      onOpenChangeComplete,
      openOnHover,
      delay,
      closeDelay,
      modal,
    }),
    [
      open,
      setOpen,
      mounted,
      setMounted,
      transitionStatus,
      positionerElement,
      titleId,
      descriptionId,
      getReferenceProps,
      triggerProps,
      getFloatingProps,
      floatingContext,
      instantType,
      openMethod,
      openReason,
      onOpenChangeComplete,
      openOnHover,
      delay,
      closeDelay,
      modal,
    ],
  );

  return (
    <PopoverRootContext.Provider value={popoverContext}>
      {props.children}
    </PopoverRootContext.Provider>
  );
};

export namespace PopoverRoot {
  export interface State {}

  interface Parameters {
    /**
     * Whether the popover is initially open.
     *
     * To render a controlled popover, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Whether the popover is currently open.
     */
    open?: boolean;
    /**
     * Event handler called when the popover is opened or closed.
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the popover is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
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
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the popover will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the popover manually.
     * Useful when the popover's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<Actions>;
    /**
     * Determines if the popover enters a modal state when open.
     * - `true`: user interaction is limited to the popover: document page scroll is locked, and pointer interactions on outside elements are disabled.
     * - `false`: user interaction with the rest of the document is allowed.
     * - `'trap-focus'`: focus is trapped inside the popover, but document page scroll is not locked and pointer interactions outside of it remain enabled.
     * @default false
     */
    modal?: boolean | 'trap-focus';
  }

  export interface Props extends Parameters {
    children?: React.ReactNode;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = PopoverOpenChangeReason;
}
