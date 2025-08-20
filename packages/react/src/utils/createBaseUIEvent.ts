import type { PreventBaseUIHandlerOptions, BaseOpenChangeReason } from './types';

export interface BaseUIEventData<Reason extends string = BaseOpenChangeReason> {
  reason: Reason;
  preventBaseUIHandler: (options?: PreventBaseUIHandlerOptions) => void;
  baseUIHandlerPrevented: false | PreventBaseUIHandlerOptions;
  event: Event;
}

/**
 * Creates a Base UI event data object with the given reason and utilities
 * for preventing the framework's default handler.
 */
export function createBaseUIEventData<Reason extends string = BaseOpenChangeReason>(
  reason: Reason,
  event: Event | undefined = new Event('base-ui'),
): BaseUIEventData<Reason> {
  let preventedOptions: PreventBaseUIHandlerOptions | false = false;
  return {
    reason,
    event,
    preventBaseUIHandler(options: PreventBaseUIHandlerOptions = {}) {
      preventedOptions = options;
    },
    get baseUIHandlerPrevented() {
      return preventedOptions;
    },
  };
}

export function isEventPrevented(data: BaseUIEventData<any>) {
  if (
    !data.baseUIHandlerPrevented ||
    !isStopPropagationAllowed(data) ||
    !isPreventDefaultAllowed(data)
  ) {
    return false;
  }
  return true;
}

export function isStopPropagationAllowed(data: BaseUIEventData<any>) {
  if (!data.baseUIHandlerPrevented) {
    return true;
  }
  return data.baseUIHandlerPrevented.allowStopPropagation !== false;
}

export function isPreventDefaultAllowed(data: BaseUIEventData<any>) {
  if (!data.baseUIHandlerPrevented) {
    return true;
  }
  return data.baseUIHandlerPrevented.allowPreventDefault !== false;
}
