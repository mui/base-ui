import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useForkRef } from '../../utils/useForkRef';
import { useId } from '../../utils/useId';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useCompoundItem } from '../../useCompound';
import { valueToPercent } from '../utils';
import { useSliderContext } from '../Root/SliderContext';
import {
  SliderThumbMetadata,
  UseSliderThumbParameters,
  UseSliderThumbReturnValue,
} from './SliderThumb.types';

function idGenerator(existingKeys: Set<string>) {
  return `thumb-${existingKeys.size}`;
}

export function useSliderThumb(parameters: UseSliderThumbParameters) {
  const { disabled: disabledProp = false, id: idParam, rootRef: externalRef } = parameters;

  const {
    active: activeIndex,
    'aria-labelledby': ariaLabelledby,
    axis,
    changeValue,
    disabled,
    isRtl,
    largeStep,
    max,
    min,
    name,
    orientation,
    scale,
    setOpen,
    step,
    tabIndex,
    value: sliderValues,
  } = useSliderContext('Thumb');

  const isThumbDisabled = disabledProp || disabled;

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
        onPointerOver(/* event: React.PointerEvent<HTMLSpanElement> */) {
          // const index = Number(event.currentTarget.getAttribute('data-index'));
          setOpen(index);
        },
        onPointerLeave() {
          setOpen(-1);
        },
        ref: handleRef,
        style: {
          ...getThumbStyle(),
        },
      });
    },
    [getThumbStyle, idParam, index, handleRef, setOpen],
  );

  const getThumbInputProps: UseSliderThumbReturnValue['getThumbInputProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'input'>(externalProps, {
        'aria-labelledby': ariaLabelledby,
        'aria-orientation': orientation,
        'aria-valuemax': scale(max),
        'aria-valuemin': scale(min),
        disabled,
        name,
        id: compoundItemId,
        onChange(event: React.ChangeEvent) {
          // @ts-ignore
          changeValue(event.target.valueAsNumber, index, event);
        },
        onFocus() {
          setOpen(index);
        },
        onBlur() {
          setOpen(-1);
        },
        onKeyDown(event: React.KeyboardEvent) {
          // The Shift + Up/Down keyboard shortcuts for moving the slider makes sense to be supported
          // only if the step is defined. If the step is null, this means tha the marks are used for specifying the valid values.
          if (step !== null) {
            let newValue = null;
            if (
              ((event.key === 'ArrowLeft' || event.key === 'ArrowDown') && event.shiftKey) ||
              event.key === 'PageDown'
            ) {
              newValue = Math.max(thumbValue - largeStep, min);
            } else if (
              ((event.key === 'ArrowRight' || event.key === 'ArrowUp') && event.shiftKey) ||
              event.key === 'PageUp'
            ) {
              newValue = Math.min(thumbValue + largeStep, max);
            }

            if (newValue !== null) {
              changeValue(newValue, index, event);
              event.preventDefault();
            }
          }
        },
        ref: inputRef,
        // TODO: step
        style: {
          ...visuallyHidden,
          direction: isRtl ? 'rtl' : 'ltr',
          // So that VoiceOver's focus indicator matches the thumb's dimensions
          width: '100%',
          height: '100%',
        },
        tabIndex,
        type: 'range',
        value: thumbValue ?? '',
      });
    },
    [
      ariaLabelledby,
      changeValue,
      compoundItemId,
      disabled,
      index,
      isRtl,
      largeStep,
      max,
      min,
      name,
      orientation,
      setOpen,
      scale,
      step,
      tabIndex,
      thumbValue,
    ],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      getThumbInputProps,
      index,
      disabled: isThumbDisabled,
    }),
    [getRootProps, getThumbInputProps, index, isThumbDisabled],
  );
}
