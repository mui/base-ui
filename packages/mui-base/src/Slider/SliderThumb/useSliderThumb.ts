import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { useId } from '../../utils/useId';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useCompoundItem } from '../../useCompound';
import { valueToPercent } from '../utils';
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
/**
 *
 * API:
 *
 * - [useSliderThumb API](https://mui.com/base-ui/api/use-slider-thumb/)
 */
export function useSliderThumb(parameters: UseSliderThumbParameters) {
  const {
    active: activeIndex,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    axis,
    changeValue,
    disabled,
    getAriaLabel,
    getAriaValueText,
    id: idParam,
    isRtl,
    largeStep,
    max,
    min,
    name,
    orientation,
    rootRef: externalRef,
    scale,
    setOpen,
    step,
    tabIndex,
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

  const percent = valueToPercent(thumbValue, min, max);

  const offsetCssProperty = {
    horizontal: 'left',
    'horizontal-reverse': 'right',
    vertical: 'bottom',
  }[axis];

  const getThumbStyle = React.useCallback(() => {
    return {
      [offsetCssProperty]: `${percent}%`,
      // So the non active thumb doesn't show its label on hover.
      pointerEvents: activeIndex !== -1 && activeIndex !== index ? 'none' : undefined,
    };
  }, [activeIndex, offsetCssProperty, percent, index]);

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
              newValue = getNewValue(thumbValue, largeStep, isRtl ? -1 : 1, min, max);
              break;
            case 'PageDown':
              newValue = getNewValue(thumbValue, largeStep, isRtl ? 1 : -1, min, max);
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
      setOpen,
      step,
      tabIndex,
      thumbValue,
    ],
  );

  const getThumbInputProps: UseSliderThumbReturnValue['getThumbInputProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        'aria-label': getAriaLabel ? getAriaLabel(index) : ariaLabel,
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
