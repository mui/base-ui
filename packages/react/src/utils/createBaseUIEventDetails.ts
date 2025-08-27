import type { BaseUIChangeReason } from './types';

/**
 * Maps an open-change `reason` string to the corresponding native event type.
 */
export type ReasonToEvent<Reason extends string> = Reason extends 'trigger-press'
  ? MouseEvent | PointerEvent | TouchEvent | KeyboardEvent
  : Reason extends 'trigger-hover'
    ? MouseEvent
    : Reason extends 'outside-press'
      ? MouseEvent | PointerEvent
      : Reason extends 'item-press' | 'close-press'
        ? MouseEvent | KeyboardEvent | PointerEvent
        : Reason extends 'cancel-open'
          ? MouseEvent
          : Reason extends 'trigger-focus' | 'focus-out'
            ? FocusEvent
            : Reason extends 'escape-key' | 'list-navigation'
              ? KeyboardEvent
              : Event;

/**
 * Details of custom events emitted by Base UI components.
 */
export type BaseUIEventDetails<Reason extends string = BaseUIChangeReason> = {
  [K in Reason]: {
    /**
     * The reason for the event.
     */
    reason: K;
    /**
     * The native event associated with the custom event.
     */
    event: ReasonToEvent<K>;
    /**
     * Cancels Base UI from handling the event.
     */
    cancel: () => void;
    /**
     * Allows the event to propagate in cases where Base UI will stop the propagation.
     */
    allowPropagation: () => void;
    /**
     * Indicates whether the event has been canceled.
     */
    isCanceled: boolean;
    /**
     * Indicates whether the event is allowed to propagate.
     */
    isPropagationAllowed: boolean;
  };
}[Reason];

/**
 * Creates a Base UI event details object with the given reason and utilities
 * for preventing Base UI's internal event handling.
 */
export function createBaseUIEventDetails<Reason extends string = BaseUIChangeReason>(
  reason: Reason,
  event?: ReasonToEvent<Reason>,
): BaseUIEventDetails<Reason> {
  let canceled = false;
  let allowPropagation = false;
  return {
    reason,
    event: (event ?? new Event('base-ui')) as ReasonToEvent<Reason>,
    cancel() {
      canceled = true;
    },
    allowPropagation() {
      allowPropagation = true;
    },
    get isCanceled() {
      return canceled;
    },
    get isPropagationAllowed() {
      return allowPropagation;
    },
  };
}
