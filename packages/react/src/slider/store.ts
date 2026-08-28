import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { clamp } from '@base-ui/utils/clamp';
import { NOOP } from '@base-ui/utils/empty';
import { ReactStore } from '@base-ui/utils/store';
import type { CompositeMetadata } from '../internals/composite/list/CompositeList';
import {
  createChangeEventDetails,
  createGenericEventDetails,
} from '../internals/createBaseUIEventDetails';
import { REASONS } from '../internals/reasons';
import type { SliderRoot } from './root/SliderRoot';
import type { ThumbMetadata } from './thumb/SliderThumb';
import { getSliderValue } from './utils/getSliderValue';
import { validateMinimumDistance } from './utils/validateMinimumDistance';
import { asc } from './utils/asc';

export interface SliderStoreState {
  /**
   * The value of the slider (internal state).
   * Potentially unsorted, e.g. to support frozen arrays.
   * https://github.com/mui/material-ui/pull/28472
   */
  value: number | readonly number[];
  /**
   * The value of the slider (external prop).
   * Synchronized by `useControlledProp` in a layout effect, so it lags one commit behind the
   * render that received a new prop. Use the `renderValue` selector during render.
   */
  readonly valueProp: number | readonly number[] | undefined;
  disabled: boolean;
  max: number;
  min: number;
  minStepsBetweenValues: number;
  name: string | undefined;
  step: number;
  /**
   * The index of the active thumb.
   * We can't use the `:active` browser pseudo-class:
   * - The active state isn't triggered when clicking on the rail.
   * - The active state isn't transferred when inversing a range slider.
   */
  active: number;
  dragging: boolean;
  /**
   * The index of the most recently interacted thumb.
   */
  lastUsedThumbIndex: number;
  indicatorPosition: (number | undefined)[];
  registeredLabelId: string | undefined;
  thumbMap: Map<Node, CompositeMetadata<ThumbMetadata>>;
}

/**
 * Non-reactive values shared with the slider parts. Nothing here is observable through
 * `selectors`, so writing to a ref never notifies subscribers.
 */
export interface SliderStoreContext {
  readonly controlRef: React.RefObject<HTMLElement | null>;
  readonly lastChangeReasonRef: React.RefObject<SliderRoot.ChangeEventReason>;
  /**
   * The px distance between the pointer and the center of a pressed thumb.
   */
  readonly pressedThumbCenterOffsetRef: React.RefObject<number | null>;
  /**
   * The index of the pressed thumb, or the closest thumb if the `Control` was pressed.
   * This is updated on pointerdown, which is sooner than the `active` state which is
   * updated later when the nested `input` receives focus.
   */
  readonly pressedThumbIndexRef: React.RefObject<number>;
  /**
   * The values when the current drag interaction started.
   */
  readonly pressedValuesRef: React.RefObject<readonly number[] | null>;
  readonly thumbRefs: React.RefObject<(HTMLElement | null)[]>;

  // Callback props. Seeded with `NOOP` when the store is constructed and assigned during the
  // root's render through `useContextCallback`, so they are not `readonly`.
  onValueChange: (value: number | number[], eventDetails: SliderRoot.ChangeEventDetails) => void;
  /**
   * Called when a value change is committed: when a drag ends, or immediately for keyboard
   * and input changes.
   */
  onValueCommitted: (
    value: number | readonly number[],
    eventDetails: SliderRoot.CommitEventDetails,
  ) => void;
  setTouched: (touched: boolean) => void;
}

interface ValuesCacheEntry {
  value: number | readonly number[];
  min: number;
  max: number;
  values: readonly number[];
}

/**
 * Selectors are created per store because `values` memoizes its result.
 *
 * `values` is keyed on its `(value, min, max)` arguments rather than on the store state: the
 * root passes render-time props so it can derive `values` during the render that received
 * them, before `useControlledProp` and `useSyncedValues` write them into the store in a layout
 * effect. Descendant ref callbacks therefore see the current values in the same commit.
 *
 * The cache keeps the two most recent entries. `useSyncExternalStore` only swaps a
 * subscription's snapshot function in a passive effect, so a store write during layout effects
 * (`useControlledProp`, `setIndicatorPosition`) still reads through the previous render's
 * arguments. A single entry would be evicted by the new arguments, produce a new array reference
 * for the old ones, and force an extra render of the whole slider on every value change.
 */
function createSelectors() {
  let current: ValuesCacheEntry | undefined;
  let previous: ValuesCacheEntry | undefined;

  function matches(entry: ValuesCacheEntry | undefined, value: unknown, min: number, max: number) {
    return (
      entry !== undefined &&
      Object.is(entry.value, value) &&
      Object.is(entry.min, min) &&
      Object.is(entry.max, max)
    );
  }

  return {
    /**
     * The current value, used by commands after the store has been synchronized.
     */
    value: (storeState: SliderStoreState) => storeState.valueProp ?? storeState.value,
    /**
     * The value to render. Takes the `value` prop as an argument because `state.valueProp` is
     * only synchronized in a layout effect and is stale during the render that changed it.
     */
    renderValue: (
      storeState: SliderStoreState,
      valueProp: number | readonly number[] | undefined,
    ) => valueProp ?? storeState.value,
    /**
     * The normalized values: one per thumb, clamped to the bounds and sorted.
     */
    values: (
      _storeState: SliderStoreState,
      value: number | readonly number[],
      min: number,
      max: number,
    ) => {
      if (matches(current, value, min, max)) {
        return current!.values;
      }

      if (matches(previous, value, min, max)) {
        return previous!.values;
      }

      const values = Array.isArray(value)
        ? value.map((item) => clamp(item, min, max)).sort(asc)
        : [clamp(value as number, min, max)];

      previous = current;
      current = { value, min, max, values };

      return values;
    },
    active: (storeState: SliderStoreState) => storeState.active,
    activeWhileDisabled: (storeState: SliderStoreState) =>
      storeState.disabled && storeState.active !== -1,
    dragging: (storeState: SliderStoreState) => storeState.dragging,
    lastUsedThumbIndex: (storeState: SliderStoreState) => storeState.lastUsedThumbIndex,
    indicatorPosition: (storeState: SliderStoreState) => storeState.indicatorPosition,
    registeredLabelId: (storeState: SliderStoreState) => storeState.registeredLabelId,
    thumbMap: (storeState: SliderStoreState) => storeState.thumbMap,
  };
}

type SliderStoreSelectors = ReturnType<typeof createSelectors>;

export class SliderStore extends ReactStore<
  SliderStoreState,
  SliderStoreContext,
  SliderStoreSelectors
> {
  constructor(state: SliderStoreState) {
    super(
      state,
      {
        controlRef: { current: null },
        lastChangeReasonRef: { current: REASONS.none },
        pressedThumbCenterOffsetRef: { current: null },
        pressedThumbIndexRef: { current: -1 },
        pressedValuesRef: { current: null },
        thumbRefs: { current: [] },
        onValueChange: NOOP,
        onValueCommitted: NOOP,
        setTouched: NOOP,
      },
      createSelectors(),
    );

    // Resets the active thumb when the slider becomes disabled.
    // This must stay the first listener registered on the store: `Store.setState` stops
    // notifying the remaining listeners once a nested update has run, so React subscribers only
    // ever observe `{ disabled: true, active: -1 }` as a single transaction. Registering it
    // later (for example from an effect in the root) would let them render the intermediate
    // state. The unsubscribe function is discarded on purpose: the observer only references
    // this store and shares its lifetime.
    void this.observe('activeWhileDisabled', (activeWhileDisabled) => {
      if (activeWhileDisabled) {
        this.setActive(-1);
      }
    });
  }

  readonly registerFieldControlRef = (element: HTMLElement | null) => {
    if (element) {
      this.context.controlRef.current = element;
    }
  };

  readonly setActive = (index: number) => {
    if (index === -1) {
      this.set('active', -1);
    } else {
      this.update({ active: index, lastUsedThumbIndex: index });
    }
  };

  readonly setDragging = (dragging: boolean) => {
    this.set('dragging', dragging);
  };

  readonly setIndicatorPosition = (index: 0 | 1, value: number | undefined) => {
    const current = this.state.indicatorPosition;
    if (current[index] !== value) {
      this.set('indicatorPosition', index === 0 ? [value, current[1]] : [current[0], value]);
    }
  };

  readonly setLabelId: React.Dispatch<React.SetStateAction<string | undefined>> = (value) => {
    const current = this.state.registeredLabelId;
    this.set('registeredLabelId', typeof value === 'function' ? value(current) : value);
  };

  readonly setThumbMap = (thumbMap: Map<Node, CompositeMetadata<ThumbMetadata>>) => {
    this.set('thumbMap', thumbMap);
  };

  /**
   * Applies a new value through `onValueChange` for keyboard, input, track-press,
   * and drag interactions. Returns `true` when the value was applied, or `false`
   * when it was invalid (NaN), unchanged, or the change was canceled.
   */
  readonly setValue = (newValue: number | number[], details: SliderRoot.ChangeEventDetails) => {
    const value = this.select('value');
    if (Number.isNaN(newValue) || areValuesEqual(newValue, value)) {
      return false;
    }

    // Redefine target to allow name and value to be read.
    // This allows seamless integration with the most popular form libraries.
    // https://github.com/mui/material-ui/issues/13485#issuecomment-676048492
    // Clone the event to not override `target` of the original event.
    const nativeEvent = details.event;
    const EventConstructor = nativeEvent.constructor as typeof Event;
    const clonedEvent = new EventConstructor(nativeEvent.type, nativeEvent);

    Object.defineProperty(clonedEvent, 'target', {
      writable: true,
      value: { value: newValue, name: this.state.name },
    });

    details.event = clonedEvent;
    this.context.onValueChange(newValue, details);

    if (details.isCanceled) {
      return false;
    }

    this.context.lastChangeReasonRef.current = details.reason;

    // Only the uncontrolled value lives in the store. When controlled, the parent owns the
    // value and reflects the change through the `value` prop.
    if (this.state.valueProp === undefined) {
      this.set('value', newValue);
    }

    return true;
  };

  readonly handleInputChange = (
    valueInput: number,
    index: number,
    event: React.KeyboardEvent | React.ChangeEvent,
  ) => {
    const { max, min, minStepsBetweenValues, step } = this.state;
    const value = this.select('value');
    const values = this.select('values', value, min, max);
    const newValue = getSliderValue(valueInput, index, min, max, Array.isArray(value), values);

    if (!validateMinimumDistance(newValue, step, minStepsBetweenValues)) {
      return;
    }

    const reason = 'key' in event ? REASONS.keyboard : REASONS.inputChange;
    const applied = this.setValue(
      newValue,
      createChangeEventDetails(reason, event.nativeEvent, undefined, {
        activeThumbIndex: index,
      }),
    );
    this.context.setTouched(true);

    if (applied) {
      this.context.onValueCommitted(newValue, createGenericEventDetails(reason, event.nativeEvent));
    }
  };
}

function areValuesEqual(
  newValue: number | readonly number[],
  oldValue: number | readonly number[],
) {
  return (
    newValue === oldValue ||
    (Array.isArray(newValue) && Array.isArray(oldValue) && areArraysEqual(newValue, oldValue))
  );
}
