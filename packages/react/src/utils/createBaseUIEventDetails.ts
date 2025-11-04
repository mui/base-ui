import { EMPTY_OBJECT } from './constants';

interface ReasonToEventMap {
  none: Event;
  'trigger-press': MouseEvent | PointerEvent | TouchEvent | KeyboardEvent;
  'trigger-hover': MouseEvent;
  'outside-press': MouseEvent | PointerEvent | TouchEvent;
  'item-press': MouseEvent | KeyboardEvent | PointerEvent;
  'close-press': MouseEvent | KeyboardEvent | PointerEvent;
  'cancel-open': MouseEvent;
  'trigger-focus': FocusEvent;
  'focus-out': FocusEvent;
  'escape-key': KeyboardEvent;
  'list-navigation': KeyboardEvent;
  'window-resize': UIEvent;
  'sibling-open': Event;
  'input-change': InputEvent | Event;
  'input-clear': InputEvent | FocusEvent | Event;
  'input-blur': FocusEvent;
  'input-paste': ClipboardEvent;
  keyboard: KeyboardEvent;
  pointer: PointerEvent;
  drag: PointerEvent | TouchEvent;
  'track-press': PointerEvent | MouseEvent | TouchEvent;
  'increment-press': PointerEvent | MouseEvent | TouchEvent;
  'decrement-press': PointerEvent | MouseEvent | TouchEvent;
  wheel: WheelEvent;
  scrub: PointerEvent;
  'clear-press': PointerEvent | MouseEvent | KeyboardEvent;
  'chip-remove-press': PointerEvent | MouseEvent | KeyboardEvent;
}

/**
 * Maps a change `reason` string to the corresponding native event type.
 */
export type ReasonToEvent<Reason extends string> = Reason extends keyof ReasonToEventMap
  ? ReasonToEventMap[Reason]
  : Event;

type BaseUIChangeEventDetail<Reason extends string, CustomProperties extends object> = {
  /**
   * The reason for the event.
   */
  reason: Reason;
  /**
   * The native event associated with the custom event.
   */
  event: ReasonToEvent<Reason>;
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

/**
 * Details of custom change events emitted by Base UI components.
 */
export type BaseUIChangeEventDetails<
  Reason extends string,
  CustomProperties extends object = {},
> = Reason extends string ? BaseUIChangeEventDetail<Reason, CustomProperties> : never;

/**
 * Details of custom generic events emitted by Base UI components.
 */
type BaseUIGenericEventDetail<Reason extends string, CustomProperties extends object> = {
  /**
   * The reason for the event.
   */
  reason: Reason;
  /**
   * The native event associated with the custom event.
   */
  event: ReasonToEvent<Reason>;
} & CustomProperties;

export type BaseUIGenericEventDetails<
  Reason extends string,
  CustomProperties extends object = {},
> = Reason extends string ? BaseUIGenericEventDetail<Reason, CustomProperties> : never;

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
  const details: BaseUIChangeEventDetail<Reason, CustomProperties> = {
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
  return details as BaseUIChangeEventDetails<Reason, CustomProperties>;
}

export function createGenericEventDetails<
  Reason extends string,
  CustomProperties extends object = {},
>(
  reason: Reason,
  event?: ReasonToEvent<Reason>,
  customProperties?: CustomProperties,
): BaseUIGenericEventDetails<Reason, CustomProperties> {
  const custom = customProperties ?? (EMPTY_OBJECT as CustomProperties);
  const details: BaseUIGenericEventDetail<Reason, CustomProperties> = {
    reason,
    event: (event ?? new Event('base-ui')) as ReasonToEvent<Reason>,
    ...custom,
  };
  return details as BaseUIGenericEventDetails<Reason, CustomProperties>;
}
