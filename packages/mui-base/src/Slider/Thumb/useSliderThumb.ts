'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useId } from '../../utils/useId';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useCompoundItem } from '../../useCompound';
import type { useSliderRoot } from '../Root/useSliderRoot';
import { useFieldControlValidation } from '../../Field/Control/useFieldControlValidation';
import { useFieldRootContext } from '../../Field/Root/FieldRootContext';
import { getSliderValue } from '../utils/getSliderValue';

function idGenerator(existingKeys: Set<string>) {
  return `thumb-${existingKeys.size}`;
}

function getNewValue(
  thumbValue: number,
  step: number,
  direction: 1 | -1,
  min: number,
  max: number,
): number {
  return direction === 1 ? Math.min(thumbValue + step, max) : Math.max(thumbValue - step, min);
}

function getDefaultAriaValueText(values: readonly number[], index: number): string | undefined {
  if (index < 0) {
    return undefined;
  }

  if (values.length === 2) {
    if (index === 0) {
      return `${values[index]} start range`;
    }

    return `${values[index]} end range`;
  }

  return undefined;
}

export function useSliderThumb(parameters: useSliderThumb.Parameters): useSliderThumb.ReturnValue {
  const {
    active: activeIndex,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    axis,
    changeValue,
    direction,
    disabled,
    getAriaLabel,
    getAriaValueText,
    id: idParam,
    largeStep,
    max,
    min,
    minStepsBetweenValues,
    name,
    orientation,
    rootRef: externalRef,
    step,
    tabIndex,
    percentageValues,
    values: sliderValues,
  } = parameters;

  const { setTouched } = useFieldRootContext();
  const {
    getInputValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const thumbId = useId(idParam);
  const thumbRef = React.useRef<HTMLElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const mergedInputRef = useForkRef(inputRef, inputValidationRef);
  const handleRef = useForkRef(externalRef, thumbRef);

  const thumbMetadata: useSliderThumb.Metadata = React.useMemo(
    () => ({ inputId: thumbId ? `${thumbId}-input` : '', ref: thumbRef, inputRef }),
    [thumbId],
  );

  const { id: compoundItemId, index } = useCompoundItem(
    (thumbId ? `${thumbId}-input` : thumbId) ?? idGenerator,
    thumbMetadata,
  );

  const thumbValue = sliderValues[index];

  // for SSR, don't wait for the index if there's only one thumb
  const percent = percentageValues.length === 1 ? percentageValues[0] : percentageValues[index];

  const isRtl = direction === 'rtl';

  const getThumbStyle = React.useCallback(() => {
    const isVertical = orientation === 'vertical';

    if (!Number.isFinite(percent)) {
      return visuallyHidden;
    }

    return {
      position: 'absolute',
      [{
        horizontal: 'left',
        'horizontal-reverse': 'right',
        vertical: 'bottom',
      }[axis]]: `${percent}%`,
      [isVertical ? 'left' : 'top']: '50%',
      transform: `translate(${(isVertical || !isRtl ? -1 : 1) * 50}%, ${(isVertical ? 1 : -1) * 50}%)`,
      // So the non active thumb doesn't show its label on hover.
      pointerEvents: activeIndex !== -1 && activeIndex !== index ? 'none' : undefined,
      zIndex: activeIndex === index ? 1 : undefined,
    };
  }, [activeIndex, axis, isRtl, orientation, percent, index]);

  const getRootProps: useSliderThumb.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        'data-index': index,
        id: idParam,
        onBlur() {
          if (!thumbRef.current) {
            return;
          }
          setTouched(true);
          commitValidation(
            getSliderValue({
              valueInput: thumbValue,
              min,
              max,
              index,
              range: sliderValues.length > 1,
              values: sliderValues,
            }),
          );
        },
        onKeyDown(event: React.KeyboardEvent) {
          let newValue = null;
          const isRange = sliderValues.length > 1;
          switch (event.key) {
            case 'ArrowUp':
              newValue = getNewValue(thumbValue, event.shiftKey ? largeStep : step, 1, min, max);
              break;
            case 'ArrowRight':
              newValue = getNewValue(
                thumbValue,
                event.shiftKey ? largeStep : step,
                isRtl ? -1 : 1,
                min,
                max,
              );
              break;
            case 'ArrowDown':
              newValue = getNewValue(thumbValue, event.shiftKey ? largeStep : step, -1, min, max);
              break;
            case 'ArrowLeft':
              newValue = getNewValue(
                thumbValue,
                event.shiftKey ? largeStep : step,
                isRtl ? 1 : -1,
                min,
                max,
              );
              break;
            case 'PageUp':
              newValue = getNewValue(thumbValue, largeStep, 1, min, max);
              break;
            case 'PageDown':
              newValue = getNewValue(thumbValue, largeStep, -1, min, max);
              break;
            case 'End':
              newValue = max;

              if (isRange) {
                newValue = Number.isFinite(sliderValues[index + 1])
                  ? sliderValues[index + 1] - step * minStepsBetweenValues
                  : max;
              }
              break;
            case 'Home':
              newValue = min;

              if (isRange) {
                newValue = Number.isFinite(sliderValues[index - 1])
                  ? sliderValues[index - 1] + step * minStepsBetweenValues
                  : min;
              }
              break;
            default:
              break;
          }

          if (newValue !== null) {
            changeValue(newValue, index, event);
            event.preventDefault();
          }
        },
        ref: handleRef,
        style: {
          ...getThumbStyle(),
        },
        tabIndex: tabIndex ?? (disabled ? undefined : 0),
      });
    },
    [
      index,
      idParam,
      handleRef,
      getThumbStyle,
      tabIndex,
      disabled,
      setTouched,
      commitValidation,
      thumbValue,
      sliderValues,
      largeStep,
      step,
      min,
      max,
      isRtl,
      minStepsBetweenValues,
      changeValue,
    ],
  );

  const getThumbInputProps: useSliderThumb.ReturnValue['getThumbInputProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(getInputValidationProps(externalProps), {
        'aria-label': getAriaLabel ? getAriaLabel(index) : ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-orientation': orientation,
        'aria-valuemax': max,
        'aria-valuemin': min,
        'aria-valuenow': thumbValue,
        'aria-valuetext': getAriaValueText
          ? getAriaValueText(thumbValue, index)
          : ariaValuetext ?? getDefaultAriaValueText(sliderValues, index),
        'data-index': index,
        disabled,
        id: compoundItemId,
        max,
        min,
        name,
        onChange(event: React.ChangeEvent) {
          // @ts-ignore
          changeValue(event.target.valueAsNumber, index, event);
        },
        ref: mergedInputRef,
        step,
        style: {
          ...visuallyHidden,
          direction: isRtl ? 'rtl' : 'ltr',
          // So that VoiceOver's focus indicator matches the thumb's dimensions
          width: '100%',
          height: '100%',
        },
        tabIndex: -1,
        type: 'range',
        value: thumbValue ?? '',
      });
    },
    [
      ariaLabel,
      ariaLabelledby,
      ariaValuetext,
      changeValue,
      compoundItemId,
      disabled,
      getAriaLabel,
      getAriaValueText,
      index,
      isRtl,
      max,
      min,
      name,
      orientation,
      sliderValues,
      step,
      thumbValue,
      getInputValidationProps,
      mergedInputRef,
    ],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      getThumbInputProps,
      index,
      disabled,
    }),
    [getRootProps, getThumbInputProps, index, disabled],
  );
}

export namespace useSliderThumb {
  export interface Metadata {
    inputId: string;
    ref: React.RefObject<HTMLElement>;
    inputRef: React.RefObject<HTMLInputElement>;
  }

  export interface Parameters
    extends Pick<
      useSliderRoot.ReturnValue,
      | 'active'
      | 'aria-labelledby'
      | 'axis'
      | 'changeValue'
      | 'direction'
      | 'largeStep'
      | 'max'
      | 'min'
      | 'minStepsBetweenValues'
      | 'name'
      | 'orientation'
      | 'percentageValues'
      | 'step'
      | 'tabIndex'
      | 'values'
    > {
    /**
     * The label for the input element.
     */
    'aria-label'?: string;
    /**
     * A string value that provides a user-friendly name for the current value of the slider.
     */
    'aria-valuetext'?: string;
    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the input associated with the thumb
     * @param {number} index The index of the input
     * @returns {string}
     */
    getAriaLabel?: (index: number) => string;
    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the current value of the slider.
     * This is important for screen reader users.
     * @param {number} value The thumb label's value to format.
     * @param {number} index The thumb label's index to format.
     * @returns {string}
     */
    getAriaValueText?: (value: number, index: number) => string;
    id?: string;
    disabled: boolean;
    onBlur?: React.FocusEventHandler;
    onFocus?: React.FocusEventHandler;
    onKeyDown?: React.KeyboardEventHandler;
    rootRef?: React.Ref<Element>;
  }

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    getThumbInputProps: (
      externalProps?: React.ComponentPropsWithRef<'input'>,
    ) => React.ComponentPropsWithRef<'input'>;
    index: number;
    disabled: boolean;
  }
}
