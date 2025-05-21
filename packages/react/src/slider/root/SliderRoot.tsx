'use client';
import * as React from 'react';
import { activeElement } from '@floating-ui/react/utils';
import { areArraysEqual } from '../../utils/areArraysEqual';
import { clamp } from '../../utils/clamp';
import { ownerDocument } from '../../utils/owner';
import type { BaseUIComponentProps, Orientation } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useLatestRef } from '../../utils/useLatestRef';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useRenderElement } from '../../utils/useRenderElement';
import { warn } from '../../utils/warn';
import { CompositeList, type CompositeMetadata } from '../../composite/list/CompositeList';
import type { FieldRoot } from '../../field/root/FieldRoot';
import { useField } from '../../field/useField';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { asc } from '../utils/asc';
import { getSliderValue } from '../utils/getSliderValue';
import { validateMinimumDistance } from '../utils/validateMinimumDistance';
import type { ThumbMetadata } from '../thumb/SliderThumb';
import { sliderMapping } from './stateAttributesMapping';
import { SliderRootContext } from './SliderRootContext';
import { useFormContext } from '../../form/FormContext';

function areValuesEqual(
  newValue: number | readonly number[],
  oldValue: number | readonly number[],
) {
  if (typeof newValue === 'number' && typeof oldValue === 'number') {
    return newValue === oldValue;
  }
  if (Array.isArray(newValue) && Array.isArray(oldValue)) {
    return areArraysEqual(newValue, oldValue);
  }
  return false;
}

/**
 * Groups all parts of the slider.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderRoot = React.forwardRef(function SliderRoot<
  Value extends number | readonly number[],
>(componentProps: SliderRoot.Props<Value>, forwardedRef: React.ForwardedRef<HTMLDivElement>) {
  const {
    'aria-labelledby': ariaLabelledbyProp,
    className,
    defaultValue,
    disabled: disabledProp = false,
    id: idProp,
    format,
    largeStep = 10,
    locale,
    render,
    max = 100,
    min = 0,
    minStepsBetweenValues = 0,
    name: nameProp,
    onValueChange: onValueChangeProp,
    onValueCommitted: onValueCommittedProp,
    orientation = 'horizontal',
    step = 1,
    tabIndex: externalTabIndex,
    value: valueProp,
    ...elementProps
  } = componentProps;

  const id = useBaseUiId(idProp);
  const onValueChange = useEventCallback(
    onValueChangeProp as (value: number | number[], event: Event, activeThumbIndex: number) => void,
  );
  const onValueCommitted = useEventCallback(
    onValueCommittedProp as (value: number | readonly number[], event: Event) => void,
  );

  const { clearErrors } = useFormContext();
  const {
    labelId,
    state: fieldState,
    disabled: fieldDisabled,
    name: fieldName,
    setControlId,
    setTouched,
    setDirty,
    validityData,
    validationMode,
  } = useFieldRootContext();

  const {
    getValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const ariaLabelledby = ariaLabelledbyProp ?? labelId;
  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp ?? '';

  // The internal value is potentially unsorted, e.g. to support frozen arrays
  // https://github.com/mui/material-ui/pull/28472
  const [valueUnwrapped, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue ?? min,
    name: 'Slider',
  });

  const sliderRef = React.useRef<HTMLElement>(null);
  const controlRef: React.RefObject<HTMLElement | null> = React.useRef(null);
  const thumbRefs = React.useRef<(HTMLElement | null)[]>([]);
  const lastChangedValueRef = React.useRef<number | readonly number[] | null>(null);
  const formatOptionsRef = useLatestRef(format);

  // We can't use the :active browser pseudo-classes.
  // - The active state isn't triggered when clicking on the rail.
  // - The active state isn't transferred when inversing a range slider.
  const [active, setActive] = React.useState(-1);
  const [dragging, setDragging] = React.useState(false);
  const [thumbMap, setThumbMap] = React.useState(
    () => new Map<Node, CompositeMetadata<ThumbMetadata> | null>(),
  );

  useModernLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  useField({
    id,
    commitValidation,
    value: valueUnwrapped,
    controlRef,
  });

  const registerInputValidationRef = React.useCallback(
    (element: HTMLElement | null) => {
      if (element) {
        controlRef.current = element;
        inputValidationRef.current = element.querySelector<HTMLInputElement>('input[type="range"]');
      }
    },
    [inputValidationRef],
  );

  const range = Array.isArray(valueUnwrapped);

  const values = React.useMemo(() => {
    if (!range) {
      return [clamp(valueUnwrapped as number, min, max)];
    }
    return valueUnwrapped.slice().sort(asc);
  }, [max, min, range, valueUnwrapped]);

  const setValue = useEventCallback(
    (newValue: number | number[], thumbIndex: number, event: Event) => {
      if (Number.isNaN(newValue) || areValuesEqual(newValue, valueUnwrapped)) {
        return;
      }

      setValueUnwrapped(newValue as Value);
      // Redefine target to allow name and value to be read.
      // This allows seamless integration with the most popular form libraries.
      // https://github.com/mui/material-ui/issues/13485#issuecomment-676048492
      // Clone the event to not override `target` of the original event.
      // @ts-ignore The nativeEvent is function, not object
      const clonedEvent = new event.constructor(event.type, event);

      Object.defineProperty(clonedEvent, 'target', {
        writable: true,
        value: { value: newValue, name },
      });

      lastChangedValueRef.current = newValue;
      onValueChange(newValue, clonedEvent, thumbIndex);
      clearErrors(name);
      commitValidation(newValue, true);
    },
  );

  // for keypresses only
  const handleInputChange = useEventCallback(
    (valueInput: number, index: number, event: React.KeyboardEvent | React.ChangeEvent) => {
      const newValue = getSliderValue(valueInput, index, min, max, range, values);

      if (validateMinimumDistance(newValue, step, minStepsBetweenValues)) {
        setValue(newValue, index, event.nativeEvent);
        setDirty(newValue !== validityData.initialValue);
        setTouched(true);

        const nextValue = lastChangedValueRef.current ?? newValue;
        onValueCommitted(nextValue, event.nativeEvent);
        clearErrors(name);

        if (validationMode === 'onChange') {
          commitValidation(nextValue ?? newValue);
        } else {
          commitValidation(nextValue ?? newValue, true);
        }
      }
    },
  );

  useModernLayoutEffect(() => {
    if (valueProp === undefined || dragging) {
      return;
    }

    if (min >= max) {
      warn('Slider `max` must be greater than `min`');
    }
  }, [dragging, min, max, valueProp]);

  useModernLayoutEffect(() => {
    const activeEl = activeElement(ownerDocument(sliderRef.current));
    if (disabled && sliderRef.current?.contains(activeEl)) {
      // This is necessary because Firefox and Safari will keep focus
      // on a disabled element:
      // https://codesandbox.io/p/sandbox/mui-pr-22247-forked-h151h?file=/src/App.js
      // @ts-ignore
      activeEl.blur();
    }
  }, [disabled]);

  if (disabled && active !== -1) {
    setActive(-1);
  }

  const state: SliderRoot.State = React.useMemo(
    () => ({
      ...fieldState,
      activeThumbIndex: active,
      disabled,
      dragging,
      orientation,
      max,
      min,
      minStepsBetweenValues,
      step,
      values,
    }),
    [
      fieldState,
      active,
      disabled,
      dragging,
      max,
      min,
      minStepsBetweenValues,
      orientation,
      step,
      values,
    ],
  );

  const contextValue: SliderRootContext = React.useMemo(
    () => ({
      active,
      disabled,
      dragging,
      formatOptionsRef,
      handleInputChange,
      labelId: ariaLabelledby,
      largeStep,
      lastChangedValueRef,
      locale,
      max,
      min,
      minStepsBetweenValues,
      name,
      onValueCommitted,
      orientation,
      range,
      registerInputValidationRef,
      setActive,
      setDragging,
      setValue,
      state,
      step,
      tabIndex: externalTabIndex ?? null,
      thumbMap,
      thumbRefs,
      values,
    }),
    [
      active,
      ariaLabelledby,
      disabled,
      dragging,
      externalTabIndex,
      formatOptionsRef,
      handleInputChange,
      largeStep,
      lastChangedValueRef,
      locale,
      max,
      min,
      minStepsBetweenValues,
      name,
      onValueCommitted,
      orientation,
      range,
      registerInputValidationRef,
      setActive,
      setDragging,
      setValue,
      state,
      step,
      thumbMap,
      thumbRefs,
      values,
    ],
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, sliderRef],
    props: [
      {
        'aria-labelledby': ariaLabelledby,
        id,
        role: 'group',
      },
      getValidationProps(elementProps),
      elementProps,
    ],
    stateAttributesMapping: sliderMapping,
  });

  return (
    <SliderRootContext.Provider value={contextValue}>
      <CompositeList elementsRef={thumbRefs} onMapChange={setThumbMap}>
        {element}
      </CompositeList>
    </SliderRootContext.Provider>
  );
}) as {
  <Value extends number | readonly number[]>(
    props: SliderRoot.Props<Value> & {
      ref?: React.RefObject<HTMLDivElement>;
    },
  ): React.JSX.Element;
};

export namespace SliderRoot {
  export interface State extends FieldRoot.State {
    /**
     * The index of the active thumb.
     */
    activeThumbIndex: number;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the thumb is currently being dragged.
     */
    dragging: boolean;
    max: number;
    min: number;
    /**
     * The minimum steps between values in a range slider.
     * @default 0
     */
    minStepsBetweenValues: number;
    /**
     * The component orientation.
     */
    orientation: Orientation;
    /**
     * The step increment of the slider when incrementing or decrementing. It will snap
     * to multiples of this value. Decimal values are supported.
     * @default 1
     */
    step: number;
    /**
     * The raw number value of the slider.
     */
    values: readonly number[];
  }

  export interface Props<Value extends number | readonly number[] = number | readonly number[]>
    extends BaseUIComponentProps<'div', State> {
    /**
     * The uncontrolled value of the slider when it’s initially rendered.
     *
     * To render a controlled slider, use the `value` prop instead.
     */
    defaultValue?: Value;
    /**
     * Whether the slider should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Options to format the input value.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * The locale used by `Intl.NumberFormat` when formatting the value.
     * Defaults to the user's runtime locale.
     */
    locale?: Intl.LocalesArgument;
    /**
     * The maximum allowed value of the slider.
     * Should not be equal to min.
     * @default 100
     */
    max?: number;
    /**
     * The minimum allowed value of the slider.
     * Should not be equal to max.
     * @default 0
     */
    min?: number;
    /**
     * The minimum steps between values in a range slider.
     * @default 0
     */
    minStepsBetweenValues?: number;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * The component orientation.
     * @default 'horizontal'
     */
    orientation?: Orientation;
    /**
     * The granularity with which the slider can step through values. (A "discrete" slider.)
     * The `min` prop serves as the origin for the valid values.
     * We recommend (max - min) to be evenly divisible by the step.
     * @default 1
     */
    step?: number;
    /**
     * The granularity with which the slider can step through values when using Page Up/Page Down or Shift + Arrow Up/Arrow Down.
     * @default 10
     */
    largeStep?: number;
    /**
     * Optional tab index attribute for the thumb components.
     */
    tabIndex?: number;
    /**
     * The value of the slider.
     * For ranged sliders, provide an array with two values.
     */
    value?: Value;
    /**
     * Callback function that is fired when the slider's value changed.
     *
     * @param {number | number[]} value The new value.
     * @param {Event} event The corresponding event that initiated the change.
     * You can pull out the new value by accessing `event.target.value` (any).
     * @param {number} activeThumbIndex Index of the currently moved thumb.
     */
    onValueChange?: (
      value: Value extends number ? number : Value,
      event: Event,
      activeThumbIndex: number,
    ) => void;
    /**
     * Callback function that is fired when the `pointerup` is triggered.
     *
     * @param {number | number[]} value The new value.
     * @param {Event} event The corresponding event that initiated the change.
     * **Warning**: This is a generic event not a change event.
     */
    onValueCommitted?: (value: Value extends number ? number : Value, event: Event) => void;
  }
}
