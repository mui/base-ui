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
  value: number | readonly number[];
  readonly valueProp: number | readonly number[] | undefined;
  disabled: boolean;
  max: number;
  min: number;
  minStepsBetweenValues: number;
  name: string | undefined;
  step: number;
  interaction: {
    active: number;
    dragging: boolean;
    lastUsedThumbIndex: number;
  };
  indicatorPosition: (number | undefined)[];
  registeredLabelId: string | undefined;
  thumbMap: Map<Node, CompositeMetadata<ThumbMetadata>>;
}

interface SliderStoreContext {
  onValueChange: (value: number | number[], eventDetails: SliderRoot.ChangeEventDetails) => void;
  onValueCommitted: (
    value: number | readonly number[],
    eventDetails: SliderRoot.CommitEventDetails,
  ) => void;
  setTouched: (touched: boolean) => void;
}

function createSelectors() {
  let cachedValue: number | readonly number[] | undefined;
  let cachedMin: number | undefined;
  let cachedMax: number | undefined;
  let cachedValues: readonly number[] = [];

  return {
    value: (storeState: SliderStoreState) => storeState.valueProp ?? storeState.value,
    renderValue: (
      storeState: SliderStoreState,
      valueProp: number | readonly number[] | undefined,
    ) => valueProp ?? storeState.value,
    values: (
      _storeState: SliderStoreState,
      value: number | readonly number[],
      min: number,
      max: number,
    ) => {
      if (cachedValue !== value || cachedMin !== min || cachedMax !== max) {
        cachedValue = value;
        cachedMin = min;
        cachedMax = max;
        cachedValues = Array.isArray(value)
          ? value.map((item) => clamp(item, min, max)).sort(asc)
          : [clamp(value as number, min, max)];
      }

      return cachedValues;
    },
    activeWhileDisabled: (storeState: SliderStoreState) =>
      storeState.disabled && storeState.interaction.active !== -1,
    interaction: (storeState: SliderStoreState) => storeState.interaction,
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
        onValueChange: NOOP,
        onValueCommitted: NOOP,
        setTouched: NOOP,
      },
      createSelectors(),
    );

    // The observer and its listener are both owned by this store and share its lifetime.
    void this.observe('activeWhileDisabled', (activeWhileDisabled) => {
      if (activeWhileDisabled) {
        this.setActive(-1);
      }
    });
  }

  readonly controlRef: React.RefObject<HTMLElement | null> = { current: null };

  readonly lastChangeReasonRef: React.RefObject<SliderRoot.ChangeEventReason> = {
    current: REASONS.none,
  };

  readonly pressedThumbCenterOffsetRef: React.RefObject<number | null> = { current: null };

  readonly pressedThumbIndexRef: React.RefObject<number> = { current: -1 };

  readonly pressedValuesRef: React.RefObject<readonly number[] | null> = { current: null };

  readonly thumbRefs: React.RefObject<(HTMLElement | null)[]> = { current: [] };

  readonly registerFieldControlRef = (element: HTMLElement | null) => {
    if (element) {
      this.controlRef.current = element;
    }
  };

  readonly setActive = (index: number) => {
    const { interaction } = this.state;
    const { active, lastUsedThumbIndex } = interaction;
    const nextLastUsedThumbIndex = index === -1 ? lastUsedThumbIndex : index;

    if (active === index && lastUsedThumbIndex === nextLastUsedThumbIndex) {
      return;
    }

    this.update({
      interaction: {
        ...interaction,
        active: index,
        lastUsedThumbIndex: nextLastUsedThumbIndex,
      },
    });
  };

  readonly setDragging = (dragging: boolean) => {
    const { interaction } = this.state;
    if (dragging !== interaction.dragging) {
      this.set('interaction', { ...interaction, dragging });
    }
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

  readonly setValue = (newValue: number | number[], details: SliderRoot.ChangeEventDetails) => {
    const { onValueChange } = this.context;
    const value = this.select('value');
    if (Number.isNaN(newValue) || areValuesEqual(newValue, value)) {
      return false;
    }

    const nativeEvent = details.event;
    const EventConstructor = nativeEvent.constructor as typeof Event;
    const clonedEvent = new EventConstructor(nativeEvent.type, nativeEvent);

    Object.defineProperty(clonedEvent, 'target', {
      writable: true,
      value: { value: newValue, name: this.state.name },
    });

    details.event = clonedEvent;
    onValueChange(newValue, details);

    if (details.isCanceled) {
      return false;
    }

    this.lastChangeReasonRef.current = details.reason;
    this.set('value', newValue);
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
      this.onValueCommitted(newValue, createGenericEventDetails(reason, event.nativeEvent));
    }
  };

  readonly onValueCommitted = (
    value: number | readonly number[],
    details: SliderRoot.CommitEventDetails,
  ) => {
    this.context.onValueCommitted(value, details);
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
