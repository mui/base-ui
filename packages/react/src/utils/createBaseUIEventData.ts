import type { BaseOpenChangeReason } from './types';

/**
 * Maps an open-change `reason` string to the corresponding native event type.
 */
export type ReasonToEvent<Reason extends string> = Reason extends 'trigger-press'
  ? MouseEvent | PointerEvent | TouchEvent | KeyboardEvent
  : Reason extends 'trigger-hover'
    ? MouseEvent
    : Reason extends 'outside-press'
      ? MouseEvent | PointerEvent
      : Reason extends 'item-press'
        ? MouseEvent | KeyboardEvent | PointerEvent | TouchEvent
        : Reason extends 'cancel-open' | 'close-press'
          ? MouseEvent
          : Reason extends 'trigger-focus' | 'focus-out'
            ? FocusEvent
            : Reason extends 'escape-key' | 'list-navigation'
              ? KeyboardEvent
              : Event;

/**
 * Discriminated union keyed by the `reason` string literal.
 * Narrows `event` type based on `reason`.
 */
export type BaseUIEventData<Reason extends string = BaseOpenChangeReason> = {
  [K in Reason]: {
    reason: K;
    event: ReasonToEvent<K>;
    cancel: () => void;
    cancelStopPropagation: () => void;
    isCanceled: boolean;
    isStopPropagationCanceled: boolean;
  };
}[Reason];

/**
 * Creates a Base UI event data object with the given reason and utilities
 * for preventing the Base UI's internal event handling.
 */
export function createBaseUIEventData<Reason extends string = BaseOpenChangeReason>(
  reason: Reason,
  event?: ReasonToEvent<Reason>,
): BaseUIEventData<Reason> {
  let canceled = false;
  let stopPropagationCanceled = false;
  return {
    reason,
    event: (event ?? new Event('base-ui')) as ReasonToEvent<Reason>,
    cancel() {
      canceled = true;
    },
    cancelStopPropagation() {
      stopPropagationCanceled = true;
    },
    get isCanceled() {
      return canceled;
    },
    get isStopPropagationCanceled() {
      return stopPropagationCanceled;
    },
  };
}
