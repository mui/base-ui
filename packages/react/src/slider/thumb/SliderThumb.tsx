'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { warn } from '@base-ui-components/utils/warn';
import { formatNumber } from '../../utils/formatNumber';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import {
  ARROW_DOWN,
  ARROW_UP,
  ARROW_RIGHT,
  ARROW_LEFT,
  HOME,
  END,
  COMPOSITE_KEYS,
} from '../../composite/composite';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useDirection } from '../../direction-provider/DirectionContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { getSliderValue } from '../utils/getSliderValue';
import { roundValueToStep } from '../utils/roundValueToStep';
import { valueArrayToPercentages } from '../utils/valueArrayToPercentages';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStyleHookMapping } from '../root/styleHooks';

const PAGE_UP = 'PageUp';
const PAGE_DOWN = 'PageDown';

const ALL_KEYS = new Set([
  ARROW_UP,
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  HOME,
  END,
  PAGE_UP,
  PAGE_DOWN,
]);

function getDefaultAriaValueText(
  values: readonly number[],
  index: number,
  format: Intl.NumberFormatOptions | undefined,
  locale: Intl.LocalesArgument | undefined,
): string | undefined {
  if (index < 0) {
    return undefined;
  }

  if (values.length === 2) {
    if (index === 0) {
      return `${formatNumber(values[index], locale, format)} start range`;
    }

    return `${formatNumber(values[index], locale, format)} end range`;
  }

  return format ? formatNumber(values[index], locale, format) : undefined;
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
 * The draggable part of the the slider at the tip of the indicator.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderThumb = React.forwardRef(function SliderThumb(
  componentProps: SliderThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    getAriaLabel: getAriaLabelProp,
    getAriaValueText: getAriaValueTextProp,
    id: idProp,
    index: indexProp,
    onBlur: onBlurProp,
    onFocus: onFocusProp,
    onKeyDown: onKeyDownProp,
    tabIndex: tabIndexProp,
    ...elementProps
  } = componentProps;

  const id = useBaseUiId(idProp);

  const {
    active: activeIndex,
    disabled: contextDisabled,
    fieldControlValidation,
    formatOptionsRef,
    handleInputChange,
    labelId,
    largeStep,
    locale,
    max,
    min,
    minStepsBetweenValues,
    orientation,
    setActive,
    state,
    step,
    tabIndex: contextTabIndex,
    values: sliderValues,
  } = useSliderRootContext();

  if (typeof document === 'undefined' && indexProp === undefined && sliderValues.length > 1) {
    warn(
      'A `Slider.Thumb` was rendered on the server without an `index` prop, it must be specified for full SSR support.',
    );
  }

  const disabled = disabledProp || contextDisabled;

  const externalTabIndex = tabIndexProp ?? contextTabIndex;

  const direction = useDirection();
  const { controlId, setControlId, setTouched, setFocused, validationMode } = useFieldRootContext();

  const thumbRef = React.useRef<HTMLElement>(null);

  useIsoLayoutEffect(() => {
    setControlId(id);

    return () => {
      setControlId(undefined);
    };
  }, [controlId, id, setControlId]);

  const { ref: listItemRef, index: compositeIndex } = useCompositeListItem();

  const index = indexProp ?? compositeIndex;

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

    let writingMode: React.CSSProperties['writingMode'];
    if (isVertical) {
      writingMode = isRtl ? 'vertical-rl' : 'vertical-lr';
    }

    return {
      position: 'absolute',
      [{
        horizontal: 'insetInlineStart',
        vertical: 'bottom',
      }[orientation]]: `${percent}%`,
      [isVertical ? 'left' : 'top']: '50%',
      transform: `translate(${(isVertical || !isRtl ? -1 : 1) * 50}%, ${(isVertical ? 1 : -1) * 50}%)`,
      writingMode,
      zIndex: activeIndex === index ? 1 : undefined,
    } satisfies React.CSSProperties;
  }, [activeIndex, isRtl, orientation, percent, index]);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, listItemRef, thumbRef],
    props: [
      {
        'aria-disabled': disabled,
        'aria-label': typeof getAriaLabelProp === 'function' ? getAriaLabelProp(index) : undefined,
        'aria-labelledby': labelId,
        'aria-orientation': orientation,
        'aria-valuemax': max,
        'aria-valuemin': min,
        'aria-valuenow': thumbValue,
        'aria-valuetext':
          typeof getAriaValueTextProp === 'function'
            ? getAriaValueTextProp(
                formatNumber(thumbValue, locale, formatOptionsRef.current ?? undefined),
                thumbValue,
                index,
              )
            : elementProps['aria-valuetext'] ||
              getDefaultAriaValueText(
                sliderValues,
                index,
                formatOptionsRef.current ?? undefined,
                locale,
              ),
        id,
        onFocus() {
          if (!disabled) {
            setActive(index);
            setFocused(true);
          }
        },
        onBlur() {
          if (disabled || !thumbRef.current) {
            return;
          }

          setActive(-1);
          setTouched(true);
          setFocused(false);

          if (validationMode === 'onBlur') {
            fieldControlValidation.commitValidation(
              getSliderValue(thumbValue, index, min, max, sliderValues.length > 1, sliderValues),
            );
          }
        },
        onKeyDown(event: React.KeyboardEvent) {
          if (disabled || !ALL_KEYS.has(event.key)) {
            return;
          }
          if (COMPOSITE_KEYS.has(event.key)) {
            event.stopPropagation();
          }

          let newValue = null;
          const isRange = sliderValues.length > 1;
          const roundedValue = roundValueToStep(thumbValue, step, min);
          switch (event.key) {
            case ARROW_UP:
              newValue = getNewValue(roundedValue, event.shiftKey ? largeStep : step, 1, min, max);
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
              newValue = getNewValue(roundedValue, event.shiftKey ? largeStep : step, -1, min, max);
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
            case PAGE_UP:
              newValue = getNewValue(roundedValue, largeStep, 1, min, max);
              break;
            case PAGE_DOWN:
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
        role: 'slider',
        style: getThumbStyle(),
        tabIndex: externalTabIndex ?? (disabled ? undefined : 0),
      },
      fieldControlValidation.getValidationProps,
      elementProps,
    ],
    customStyleHookMapping: sliderStyleHookMapping,
  });

  return element;
});

export namespace SliderThumb {
  export interface State extends SliderRoot.State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the thumb should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the input associated with the thumb
     * @param {number} index The index of the input
     * @returns {string}
     */
    getAriaLabel?: ((index: number) => string) | null;
    /**
     * Accepts a function which returns a string value that provides a user-friendly name for the current value of the slider.
     * This is important for screen reader users.
     * @param {string} formattedValue The thumb's formatted value.
     * @param {number} value The thumb's numerical value.
     * @param {number} index The thumb's index.
     * @returns {string}
     */
    getAriaValueText?: ((formattedValue: string, value: number, index: number) => string) | null;
    /**
     * The index of the thumb which corresponds to the index of its value in the
     * `value` or `defaultValue` array.
     * This prop is required to support server-side rendering for range sliders
     * with multiple thumbs.
     * @example
     * ```tsx
     * <Slider.Root value={[10, 20]}>
     *   <Slider.Thumb index={0} />
     *   <Slider.Thumb index={1} />
     * </Slider.Root>
     * ```
     */
    index?: number | undefined;
  }
}
