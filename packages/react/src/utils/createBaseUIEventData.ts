import type { BaseOpenChangeReason } from './types';

export interface BaseUIEventData<Reason extends string = BaseOpenChangeReason> {
  reason: Reason;
  event: Event;
  cancel: () => void;
  cancelStopPropagation: () => void;
  isCanceled: boolean;
  isStopPropagationCanceled: boolean;
}

/**
 * Creates a Base UI event data object with the given reason and utilities
 * for preventing the framework's default handler.
 */
export function createBaseUIEventData<Reason extends string = BaseOpenChangeReason>(
  reason: Reason,
  event: Event | undefined = new Event('base-ui'),
): BaseUIEventData<Reason> {
  let canceled = false;
  let stopPropagationCanceled = false;
  return {
    reason,
    event,
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
