import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
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
import { normalizeValues } from './utils/normalizeValues';

export interface SliderStoreState {
  /**
   * The value of the slider (internal state).
   * Potentially unsorted, e.g. to support frozen arrays.
   * https://github.com/mui/material-ui/pull/28472
   */
  value: number | readonly number[];
  /**
   * The value of the slider (external prop).
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
  // root's render, so they are not `readonly`.
  onValueChange: (value: number | number[], eventDetails: SliderRoot.ChangeEventDetails) => void;
  onValueCommitted: (
    value: number | readonly number[],
    eventDetails: SliderRoot.CommitEventDetails,
  ) => void;
  setTouched: (touched: boolean) => void;
}

export const selectors = {
  value: (storeState: SliderStoreState) => storeState.valueProp ?? storeState.value,
  // Takes the `value` prop as an argument because `state.valueProp` is stale during the render
  // that changed it.
  renderValue: (storeState: SliderStoreState, valueProp: number | readonly number[] | undefined) =>
    valueProp ?? storeState.value,
  active: (storeState: SliderStoreState) => storeState.active,
  activeWhileDisabled: (storeState: SliderStoreState) =>
    storeState.disabled && storeState.active !== -1,
  dragging: (storeState: SliderStoreState) => storeState.dragging,
  lastUsedThumbIndex: (storeState: SliderStoreState) => storeState.lastUsedThumbIndex,
  indicatorPosition: (storeState: SliderStoreState) => storeState.indicatorPosition,
  registeredLabelId: (storeState: SliderStoreState) => storeState.registeredLabelId,
  thumbMap: (storeState: SliderStoreState) => storeState.thumbMap,
};

export class SliderStore extends ReactStore<
  SliderStoreState,
  SliderStoreContext,
  typeof selectors
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
      selectors,
    );

    // Must be the first listener registered on the store so React subscribers never observe
    // `disabled` with an active thumb. Never unsubscribed: the observer shares the store's lifetime.
    void this.observe('activeWhileDisabled', (activeWhileDisabled) => {
      if (activeWhileDisabled) {
        this.setActive(-1);
      }
    });
  }

  registerFieldControlRef = (element: HTMLElement | null) => {
    if (element) {
      this.context.controlRef.current = element;
    }
  };

  setActive = (index: number) => {
    if (index === -1) {
      this.set('active', -1);
    } else {
      this.update({ active: index, lastUsedThumbIndex: index });
    }
  };

  setDragging = (dragging: boolean) => {
    this.set('dragging', dragging);
  };

  setIndicatorPosition = (index: 0 | 1, value: number | undefined) => {
    const current = this.state.indicatorPosition;
    if (current[index] !== value) {
      this.set('indicatorPosition', index === 0 ? [value, current[1]] : [current[0], value]);
    }
  };

  setLabelId: React.Dispatch<React.SetStateAction<string | undefined>> = (value) => {
    const current = this.state.registeredLabelId;
    this.set('registeredLabelId', typeof value === 'function' ? value(current) : value);
  };

  setThumbMap = (thumbMap: Map<Node, CompositeMetadata<ThumbMetadata>>) => {
    this.set('thumbMap', thumbMap);
  };

  /**
   * Applies a new value through `onValueChange` for keyboard, input, track-press,
   * and drag interactions. Returns `true` when the value was applied, or `false`
   * when it was invalid (NaN), unchanged, or the change was canceled.
   */
  setValue = (newValue: number | number[], details: SliderRoot.ChangeEventDetails) => {
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

    if (this.state.valueProp === undefined) {
      this.set('value', newValue);
    }

    return true;
  };

  handleInputChange = (
    valueInput: number,
    index: number,
    event: React.KeyboardEvent | React.ChangeEvent,
  ) => {
    const { max, min, minStepsBetweenValues, step } = this.state;
    const value = this.select('value');
    const values = normalizeValues(value, min, max);
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
