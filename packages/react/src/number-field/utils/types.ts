import { REASONS } from '../../internals/reasons';

export type Direction = -1 | 1;

export type DirectionalChangeReason =
  | typeof REASONS.incrementPress
  | typeof REASONS.decrementPress
  | typeof REASONS.wheel
  | typeof REASONS.scrub
  | typeof REASONS.keyboard;

export interface ChangeEventCustomProperties {
  direction?: Direction | undefined;
}

/**
 * Who authored the text currently in the input.
 *
 * - `'value'`: the text is a formatting of `value`, so the field may re-derive it at will.
 * - `'user'`: the user typed or pasted it, so it stays untouched — and stays authoritative for
 *   blurring and stepping — until an interaction reconciles it back to `value`.
 */
export type TextSource = 'value' | 'user';

export interface SetValueOptions {
  /**
   * Whether to project the formatted value back into the input text.
   *
   * Defaults to `true`: most interactions (stepping, scrubbing, blurring) reconcile the text with
   * the value they store. Direct text entry passes `false`, because the caller has already written
   * the text the user authored and must not have it overwritten mid-edit.
   */
  projectText?: boolean | undefined;
}

export interface IncrementValueParameters {
  direction: Direction;
  event?: Event | React.SyntheticEvent | undefined;
  reason: DirectionalChangeReason;
  currentValue?: number | null | undefined;
}

export interface EventWithOptionalKeyState {
  altKey?: boolean | undefined;
  shiftKey?: boolean | undefined;
}
