import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { useId } from '../../utils/useId';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useCompoundItem } from '../../useCompound';
import { SliderThumbMetadata } from '../Root/SliderRoot.types';
import { UseSliderThumbParameters, UseSliderThumbReturnValue } from './SliderThumb.types';

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

function getDefaultAriaLabel(values: readonly number[], index: number): string | undefined {
  if (values.length === 2) {
    if (index === 0) {
      return 'start';
    }

    return 'end';
  }
  return undefined;
}
/**
 *
 * Demos:
 *
 * - [Slider](https://mui.com/base-ui/react-slider/#hooks)
 *
 * API:
 *
 * - [useSliderThumb API](https://mui.com/base-ui/react-slider/hooks-api/#use-slider-thumb)
 */
export function useSliderThumb(parameters: UseSliderThumbParameters) {
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
    scale,
    setOpen,
    step,
    tabIndex,
    percentageValues,
    values: sliderValues,
  } = parameters;

  const thumbId = useId(idParam);
  const thumbRef = React.useRef<HTMLElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleRef = useForkRef(externalRef, thumbRef);

  const thumbMetadata: SliderThumbMetadata = React.useMemo(
    () => ({ inputId: thumbId ? `${thumbId}-input` : '', ref: thumbRef, inputRef }),
    [thumbId],
  );

  const { id: compoundItemId, index } = useCompoundItem(
    (thumbId ? `${thumbId}-input` : thumbId) ?? idGenerator,
    thumbMetadata,
  );

  const thumbValue = sliderValues[index];

  const percent = percentageValues[index];

  const isRtl = direction === 'rtl';

  const getThumbStyle = React.useCallback(() => {
    return {
      [{
        horizontal: 'left',
        'horizontal-reverse': 'right',
        vertical: 'bottom',
      }[axis]]: `${percent}%`,
      // So the non active thumb doesn't show its label on hover.
      pointerEvents: activeIndex !== -1 && activeIndex !== index ? 'none' : undefined,
      zIndex: activeIndex === index ? 1 : undefined,
    };
  }, [activeIndex, axis, percent, index]);

  const getRootProps: UseSliderThumbReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        'data-index': index,
        id: idParam,
        onFocus() {
          setOpen(index);
        },
        onBlur() {
          setOpen(-1);
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
            case 'Home':
              newValue = max;

              if (isRange) {
                newValue = Number.isFinite(sliderValues[index + 1])
                  ? sliderValues[index + 1] - step * minStepsBetweenValues
                  : max;
              }
              break;
            case 'End':
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
        onPointerOver() {
          setOpen(index);
        },
        onPointerLeave() {
          setOpen(-1);
        },
        ref: handleRef,
        style: {
          ...getThumbStyle(),
        },
        tabIndex: tabIndex ?? (disabled ? undefined : 0),
      });
    },
    [
      changeValue,
      getThumbStyle,
      handleRef,
      idParam,
      index,
      isRtl,
      disabled,
      largeStep,
      max,
      min,
      minStepsBetweenValues,
      setOpen,
      sliderValues,
      step,
      tabIndex,
      thumbValue,
    ],
  );

  const getThumbInputProps: UseSliderThumbReturnValue['getThumbInputProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        'aria-label': getAriaLabel
          ? getAriaLabel(index)
          : ariaLabel ?? getDefaultAriaLabel(sliderValues, index),
        'aria-labelledby': ariaLabelledby,
        'aria-orientation': orientation,
        'aria-valuemax': scale(max),
        'aria-valuemin': scale(min),
        'aria-valuenow': scale(thumbValue),
        'aria-valuetext': getAriaValueText
          ? getAriaValueText(scale(thumbValue), index)
          : ariaValuetext,
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
        ref: inputRef,
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
      scale,
      sliderValues,
      step,
      thumbValue,
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
