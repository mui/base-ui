import { EMPTY_OBJECT } from './constants';

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
 * Details of custom change events emitted by Base UI components.
 */
export type BaseUIChangeEventDetails<
  Reason extends string,
  CustomProperties extends object = {},
> = {
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
    /**
     * The element that triggered the event, if applicable.
     */
    trigger: HTMLElement | undefined;
  } & CustomProperties;
}[Reason];

/**
 * Details of custom generic events emitted by Base UI components.
 */
export type BaseUIGenericEventDetails<
  Reason extends string,
  EventType extends Event = Event,
  CustomProperties extends object = {},
> = {
  /**
   * The reason for the event.
   */
  reason: Reason;
  /**
   * The native event associated with the custom event.
   */
  event: EventType;
} & CustomProperties;

/**
 * Creates a Base UI event details object with the given reason and utilities
 * for preventing Base UI's internal event handling.
 */
export function createChangeEventDetails<
  Reason extends string,
  CustomProperties extends object = {},
>(
  reason: Reason,
  event?: ReasonToEvent<Reason>,
  trigger?: HTMLElement,
  customProperties?: CustomProperties,
): BaseUIChangeEventDetails<Reason, CustomProperties> {
  let canceled = false;
  let allowPropagation = false;
  const custom = customProperties ?? (EMPTY_OBJECT as CustomProperties);
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
    trigger,
    ...custom,
  };
}

export function createGenericEventDetails<
  Reason extends string,
  EventType extends Event = Event,
  CustomProperties extends object = {},
>(
  reason: Reason,
  event?: EventType,
  custom?: CustomProperties,
): BaseUIGenericEventDetails<Reason, EventType, CustomProperties> {
  const customProperties = custom ?? (EMPTY_OBJECT as CustomProperties);
  return {
    reason,
    event: (event ?? new Event('base-ui')) as EventType,
    ...customProperties,
  };
}
