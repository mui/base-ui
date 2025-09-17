'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { BaseUIComponentProps } from '../../utils/types';
import { formatNumber } from '../../utils/formatNumber';
import { mergeProps } from '../../merge-props';
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
import { getMidpoint } from '../utils/getMidpoint';
import { getSliderValue } from '../utils/getSliderValue';
import { roundValueToStep } from '../utils/roundValueToStep';
import { valueArrayToPercentages } from '../utils/valueArrayToPercentages';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping';
import { SliderThumbDataAttributes } from './SliderThumbDataAttributes';

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
 * Renders a `<div>` element and a nested `<input type="range">`.
 *
 * Documentation: [Base UI Slider](https://base-ui.com/react/components/slider)
 */
export const SliderThumb = React.forwardRef(function SliderThumb(
  componentProps: SliderThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    children: childrenProp,
    className,
    'aria-describedby': ariaDescribedByProp,
    'aria-label': ariaLabelProp,
    'aria-labelledby': ariaLabelledByProp,
    disabled: disabledProp = false,
    getAriaLabel: getAriaLabelProp,
    getAriaValueText: getAriaValueTextProp,
    id: idProp,
    index: indexProp,
    inputRef: inputRefProp,
    onBlur: onBlurProp,
    onFocus: onFocusProp,
    onKeyDown: onKeyDownProp,
    tabIndex: tabIndexProp,
    ...elementProps
  } = componentProps;

  const id = useBaseUiId(idProp);
  const inputId = `${id}-input`;

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
    name,
    orientation,
    pressedInputRef,
    pressedThumbCenterOffsetRef,
    pressedThumbIndexRef,
    setActive,
    state,
    step,
    values: sliderValues,
  } = useSliderRootContext();

  const disabled = disabledProp || contextDisabled;
  const range = sliderValues.length > 1;

  const direction = useDirection();
  const { controlId, setControlId, setTouched, setFocused, validationMode } = useFieldRootContext();

  const thumbRef = React.useRef<HTMLElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useIsoLayoutEffect(() => {
    setControlId(inputId);

    return () => {
      setControlId(undefined);
    };
  }, [controlId, inputId, setControlId]);

  const thumbMetadata = React.useMemo(
    () => ({
      inputId,
    }),
    [inputId],
  );

  const { ref: listItemRef, index: compositeIndex } = useCompositeListItem<ThumbMetadata>({
    metadata: thumbMetadata,
  });

  const index = !range ? 0 : (indexProp ?? compositeIndex);

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

  let cssWritingMode: React.CSSProperties['writingMode'];
  if (orientation === 'vertical') {
    cssWritingMode = isRtl ? 'vertical-rl' : 'vertical-lr';
  }

  const inputProps = mergeProps<'input'>(
    {
      'aria-label':
        typeof getAriaLabelProp === 'function' ? getAriaLabelProp(index) : ariaLabelProp,
      'aria-labelledby': ariaLabelledByProp ?? labelId,
      'aria-describedby': ariaDescribedByProp,
      'aria-orientation': orientation,
      'aria-valuenow': thumbValue,
      'aria-valuetext':
        typeof getAriaValueTextProp === 'function'
          ? getAriaValueTextProp(
              formatNumber(thumbValue, locale, formatOptionsRef.current ?? undefined),
              thumbValue,
              index,
            )
          : getDefaultAriaValueText(
              sliderValues,
              index,
              formatOptionsRef.current ?? undefined,
              locale,
            ),
      disabled,
      id: inputId,
      max,
      min,
      name,
      onChange(event: React.ChangeEvent<HTMLInputElement>) {
        handleInputChange(event.target.valueAsNumber, index, event);
      },
      onFocus() {
        setActive(index);
        setFocused(true);
      },
      onBlur() {
        if (!thumbRef.current) {
          return;
        }

        setActive(-1);
        setTouched(true);
        setFocused(false);

        if (validationMode === 'onBlur') {
          fieldControlValidation.commitValidation(
            getSliderValue(thumbValue, index, min, max, range, sliderValues),
          );
        }
      },
      onKeyDown(event: React.KeyboardEvent) {
        if (!ALL_KEYS.has(event.key)) {
          return;
        }
        if (COMPOSITE_KEYS.has(event.key)) {
          event.stopPropagation();
        }

        let newValue = null;
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

            if (range) {
              newValue = Number.isFinite(sliderValues[index + 1])
                ? sliderValues[index + 1] - step * minStepsBetweenValues
                : max;
            }
            break;
          case HOME:
            newValue = min;

            if (range) {
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
      step,
      style: {
        ...visuallyHidden,
        // So that VoiceOver's focus indicator matches the thumb's dimensions
        width: '100%',
        height: '100%',
        writingMode: cssWritingMode,
      },
      tabIndex: tabIndexProp ?? undefined,
      type: 'range',
      value: thumbValue ?? '',
    },
    fieldControlValidation.getInputValidationProps,
  );

  const mergedInputRef = useMergedRefs(inputRef, fieldControlValidation.inputRef, inputRefProp);

  const children = childrenProp ? (
    <React.Fragment>
      {childrenProp}
      <input ref={mergedInputRef} {...inputProps} />
    </React.Fragment>
  ) : (
    <input ref={mergedInputRef} {...inputProps} />
  );

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, listItemRef, thumbRef],
    props: [
      {
        [SliderThumbDataAttributes.index as string]: index,
        children,
        id,
        onBlur: onBlurProp,
        onFocus: onFocusProp,
        onPointerDown(event) {
          pressedThumbIndexRef.current = index;

          if (thumbRef.current != null) {
            const axis = orientation === 'horizontal' ? 'x' : 'y';
            const midpoint = getMidpoint(thumbRef.current);
            const offset =
              (orientation === 'horizontal' ? event.clientX : event.clientY) - midpoint[axis];
            pressedThumbCenterOffsetRef.current = offset;
          }

          if (inputRef.current != null && pressedInputRef.current !== inputRef.current) {
            pressedInputRef.current = inputRef.current;
          }
        },
        style: getThumbStyle(),
        tabIndex: -1,
      },
      elementProps,
    ],
    stateAttributesMapping: sliderStateAttributesMapping,
  });

  return element;
});

export interface ThumbMetadata {
  inputId: string | undefined;
}

export namespace SliderThumb {
  export interface State extends SliderRoot.State {}

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'onBlur' | 'onFocus'> {
    /**
     * Whether the thumb should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * A function which returns a string value for the [`aria-label`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label) attribute of the `input`.
     * @param {number} index The index of the input
     * @returns {string}
     */
    getAriaLabel?: ((index: number) => string) | null;
    /**
     * A function which returns a string value for the [`aria-valuetext`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-valuetext) attribute of the `input`.
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
    /**
     * A ref to access the nested input element.
     */
    inputRef?: React.Ref<HTMLInputElement>;
    /**
     * A blur handler forwarded to the `input`.
     */
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    /**
     * A focus handler forwarded to the `input`.
     */
    onFocus?: React.FocusEventHandler<HTMLInputElement>;
    /**
     * Optional tab index attribute forwarded to the `input`.
     */
    tabIndex?: number;
  }
}
