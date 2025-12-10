export type Direction = -1 | 1;

export type DirectionalChangeReason =
  | 'increment-press'
  | 'decrement-press'
  | 'wheel'
  | 'scrub'
  | 'keyboard';

export interface ChangeEventCustomProperties {
  direction?: Direction;
}

export interface IncrementValueParameters {
  direction: Direction;
  event?: Event | React.SyntheticEvent;
  reason: DirectionalChangeReason;
  currentValue?: number | null;
}

export interface EventWithOptionalKeyState {
  altKey?: boolean;
  shiftKey?: boolean;
}
