'use client';
import * as React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { mergeProps } from '../../merge-props';
import { GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { visuallyHidden } from '../../utils/visuallyHidden';
import {
  ARROW_DOWN,
  ARROW_UP,
  ARROW_RIGHT,
  ARROW_LEFT,
  HOME,
  END,
} from '../../composite/composite';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { getSliderValue } from '../utils/getSliderValue';
import { roundValueToStep } from '../utils/roundValueToStep';
import { valueArrayToPercentages, type useSliderRoot } from '../root/useSliderRoot';
import { SliderThumbDataAttributes } from './SliderThumbDataAttributes';

export interface ThumbMetadata {
  inputId: string | undefined;
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

function getDefaultAriaValueText(
  values: readonly number[],
  index: number,
  format: Intl.NumberFormatOptions | undefined,
): string | undefined {
  if (index < 0) {
    return undefined;
  }

  if (values.length === 2) {
    if (index === 0) {
      return `${formatNumber(values[index], [], format)} start range`;
    }

    return `${formatNumber(values[index], [], format)} end range`;
  }

  return format ? formatNumber(values[index], [], format) : undefined;
}

export function useSliderThumb(parameters: useSliderThumb.Parameters): useSliderThumb.ReturnValue {
  const {
    active: activeIndex,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    handleInputChange,
    disabled,
    format,
    getAriaLabel = null,
    getAriaValueText = null,
    id: thumbId,
    inputId,
    largeStep,
    max,
    min,
    minStepsBetweenValues,
    name,
    orientation,
    rootRef: externalRef,
    step,
    tabIndex: externalTabIndex,
    values: sliderValues,
  } = parameters;

  const direction = useDirection();
  const { setTouched, setFocused, validationMode } = useFieldRootContext();
  const {
    getInputValidationProps,
    inputRef: inputValidationRef,
    commitValidation,
  } = useFieldControlValidation();

  const thumbRef = React.useRef<HTMLElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const mergedInputRef = useForkRef(inputRef, inputValidationRef);

  const thumbMetadata = React.useMemo(
    () => ({
      inputId,
    }),
    [inputId],
  );

  const { ref: listItemRef, index } = useCompositeListItem<ThumbMetadata>({
    metadata: thumbMetadata,
  });

  const mergedThumbRef = useForkRef(externalRef, listItemRef, thumbRef);

  const thumbValue = sliderValues[index];

  const percentageValues = valueArrayToPercentages(sliderValues.slice(), min, max);
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
        horizontal: 'insetInlineStart',
        vertical: 'bottom',
      }[orientation]]: `${percent}%`,
      [isVertical ? 'left' : 'top']: '50%',
      transform: `translate(${(isVertical || !isRtl ? -1 : 1) * 50}%, ${(isVertical ? 1 : -1) * 50}%)`,
      zIndex: activeIndex === index ? 1 : undefined,
    } satisfies React.CSSProperties;
  }, [activeIndex, isRtl, orientation, percent, index]);

  const getRootProps: useSliderThumb.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeProps(
        {
          [SliderThumbDataAttributes.index]: index,
          id: thumbId,
          onFocus() {
            setFocused(true);
          },
          onBlur() {
            if (!thumbRef.current) {
              return;
            }

            setTouched(true);
            setFocused(false);

            if (validationMode === 'onBlur') {
              commitValidation(
                getSliderValue(thumbValue, index, min, max, sliderValues.length > 1, sliderValues),
              );
            }
          },
          onKeyDown(event: React.KeyboardEvent) {
            let newValue = null;
            const isRange = sliderValues.length > 1;
            const roundedValue = roundValueToStep(thumbValue, step, min);
            switch (event.key) {
              case ARROW_UP:
                newValue = getNewValue(
                  roundedValue,
                  event.shiftKey ? largeStep : step,
                  1,
                  min,
                  max,
                );
                break;
              case ARROW_RIGHT:
                newValue = getNewValue(
                  roundedValue,
                  event.shiftKey ? largeStep : step,
                  isRtl ? -1 : 1,
                  min,
                  max,
                );
                break;
              case ARROW_DOWN:
                newValue = getNewValue(
                  roundedValue,
                  event.shiftKey ? largeStep : step,
                  -1,
                  min,
                  max,
                );
                break;
              case ARROW_LEFT:
                newValue = getNewValue(
                  roundedValue,
                  event.shiftKey ? largeStep : step,
                  isRtl ? 1 : -1,
                  min,
                  max,
                );
                break;
              case 'PageUp':
                newValue = getNewValue(roundedValue, largeStep, 1, min, max);
                break;
              case 'PageDown':
                newValue = getNewValue(roundedValue, largeStep, -1, min, max);
                break;
              case END:
                newValue = max;

                if (isRange) {
                  newValue = Number.isFinite(sliderValues[index + 1])
                    ? sliderValues[index + 1] - step * minStepsBetweenValues
                    : max;
                }
                break;
              case HOME:
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
              handleInputChange(newValue, index, event);
              event.preventDefault();
            }
          },
          ref: mergedThumbRef,
          style: getThumbStyle(),
          tabIndex: externalTabIndex ?? (disabled ? undefined : 0),
        },
        externalProps,
      );
    },
    [
      commitValidation,
      disabled,
      externalTabIndex,
      getThumbStyle,
      handleInputChange,
      index,
      isRtl,
      largeStep,
      max,
      mergedThumbRef,
      min,
      minStepsBetweenValues,
      setFocused,
      setTouched,
      sliderValues,
      step,
      thumbId,
      thumbValue,
      validationMode,
    ],
  );

  const getThumbInputProps: useSliderThumb.ReturnValue['getThumbInputProps'] = React.useCallback(
    (externalProps = {}) => {
      let cssWritingMode: React.CSSProperties['writingMode'];
      if (orientation === 'vertical') {
        cssWritingMode = isRtl ? 'vertical-rl' : 'vertical-lr';
      }

      return mergeProps<'input'>(
        {
          'aria-label': getAriaLabel != null ? getAriaLabel(index) : ariaLabel,
          'aria-labelledby': ariaLabelledby,
          'aria-orientation': orientation,
          'aria-valuemax': max,
          'aria-valuemin': min,
          'aria-valuenow': thumbValue,
          'aria-valuetext':
            getAriaValueText != null
              ? getAriaValueText(
                  formatNumber(thumbValue, [], format ?? undefined),
                  thumbValue,
                  index,
                )
              : ariaValuetext || getDefaultAriaValueText(sliderValues, index, format ?? undefined),
          [SliderThumbDataAttributes.index as string]: index,
          disabled,
          id: inputId,
          max,
          min,
          name,
          onChange(event: React.ChangeEvent<HTMLInputElement>) {
            handleInputChange(event.target.valueAsNumber, index, event);
          },
          ref: mergedInputRef,
          step,
          style: {
            ...visuallyHidden,
            // So that VoiceOver's focus indicator matches the thumb's dimensions
            width: '100%',
            height: '100%',
            writingMode: cssWritingMode,
          },
          tabIndex: -1,
          type: 'range',
          value: thumbValue ?? '',
        },
        getInputValidationProps(externalProps),
      );
    },
    [
      ariaLabel,
      ariaLabelledby,
      ariaValuetext,
      handleInputChange,
      disabled,
      format,
      getAriaLabel,
      getAriaValueText,
      getInputValidationProps,
      index,
      isRtl,
      max,
      mergedInputRef,
      min,
      name,
      orientation,
      sliderValues,
      step,
      inputId,
      thumbValue,
    ],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      getThumbInputProps,
      disabled,
      index,
    }),
    [getRootProps, getThumbInputProps, disabled, index],
  );
}

export namespace useSliderThumb {
  export interface Parameters
    extends Pick<
      useSliderRoot.ReturnValue,
      | 'active'
      | 'aria-labelledby'
      | 'handleInputChange'
      | 'largeStep'
      | 'max'
      | 'min'
      | 'minStepsBetweenValues'
      | 'name'
      | 'orientation'
      | 'step'
      | 'values'
    > {
    /**
     * The label for the input element.
     */
    'aria-label': string | undefined;
    /**
     * A string value that provides a user-friendly name for the current value of the slider.
     */
    'aria-valuetext': string | undefined;
    /**
     * Options to format the input value.
     * @default null
     */
    format: Intl.NumberFormatOptions | null;
    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the input associated with the thumb
     * @param {number} index The index of the input
     * @returns {string}
     * @type {((index: number) => string) | null}
     */
    getAriaLabel?: ((index: number) => string) | null;
    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the current value of the slider.
     * This is important for screen reader users.
     * @param {string} formattedValue The thumb's formatted value.
     * @param {number} value The thumb's numerical value.
     * @param {number} index The thumb's index.
     * @returns {string}
     * @type {((formattedValue: string, value: number, index: number) => string) | null}
     */
    getAriaValueText: ((formattedValue: string, value: number, index: number) => string) | null;
    id: string | undefined;
    inputId: string | undefined;
    disabled: boolean;
    onBlur: React.FocusEventHandler;
    onFocus: React.FocusEventHandler;
    onKeyDown: React.KeyboardEventHandler;
    rootRef?: React.Ref<Element>;
    /**
     * Optional tab index attribute for the thumb components.
     * @default null
     */
    tabIndex: number | null;
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
