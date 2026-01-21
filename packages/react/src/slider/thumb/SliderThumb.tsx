'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useOnMount } from '@base-ui/utils/useOnMount';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { BaseUIComponentProps } from '../../utils/types';
import { formatNumber } from '../../utils/formatNumber';
import { mergeProps } from '../../merge-props';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useRenderElement } from '../../utils/useRenderElement';
import { valueToPercent } from '../../utils/valueToPercent';
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
import { useCSPContext } from '../../csp-provider/CSPContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { type LabelableContext } from '../../labelable-provider/LabelableContext';
import { useLabelableId } from '../../labelable-provider/useLabelableId';
import { getMidpoint } from '../utils/getMidpoint';
import { getSliderValue } from '../utils/getSliderValue';
import { roundValueToStep } from '../utils/roundValueToStep';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderRootContext } from '../root/SliderRootContext';
import { sliderStateAttributesMapping } from '../root/stateAttributesMapping';
import { SliderThumbDataAttributes } from './SliderThumbDataAttributes';
import { script as prehydrationScript } from './prehydrationScript.min';

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
 * The draggable part of the slider at the tip of the indicator.
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

  const { nonce } = useCSPContext();
  const id = useBaseUiId(idProp);

  const {
    active: activeIndex,
    lastUsedThumbIndex,
    controlRef,
    disabled: contextDisabled,
    validation,
    formatOptionsRef,
    handleInputChange,
    inset,
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
    renderBeforeHydration,
    setActive,
    setIndicatorPosition,
    state,
    step,
    values: sliderValues,
  } = useSliderRootContext();

  const direction = useDirection();

  const disabled = disabledProp || contextDisabled;
  const range = sliderValues.length > 1;
  const vertical = orientation === 'vertical';
  const rtl = direction === 'rtl';

  const { setTouched, setFocused, validationMode } = useFieldRootContext();

  const thumbRef = React.useRef<HTMLElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const defaultInputId = useBaseUiId();
  const labelableId = useLabelableId();
  const inputId = range ? defaultInputId : labelableId;

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
  const last = index === sliderValues.length - 1;
  const thumbValue = sliderValues[index];
  const thumbValuePercent = valueToPercent(thumbValue, min, max);

  const [isMounted, setIsMounted] = React.useState(false);
  const [positionPercent, setPositionPercent] = React.useState<number | undefined>();

  useOnMount(() => setIsMounted(true));

  const safeLastUsedThumbIndex =
    lastUsedThumbIndex >= 0 && lastUsedThumbIndex < sliderValues.length ? lastUsedThumbIndex : -1;

  const getInsetPosition = useStableCallback(() => {
    const control = controlRef.current;
    const thumb = thumbRef.current;
    if (!control || !thumb) {
      return;
    }
    const thumbRect = thumb.getBoundingClientRect();
    const controlRect = control.getBoundingClientRect();

    const side = vertical ? 'height' : 'width';
    // the total travel distance adjusted to account for the thumb size
    const controlSize = controlRect[side] - thumbRect[side];
    // px distance from the starting edge (inline-start or bottom) to the thumb center
    const thumbOffsetFromControlEdge =
      thumbRect[side] / 2 + (controlSize * thumbValuePercent) / 100;
    const nextPositionPercent = (thumbOffsetFromControlEdge / controlRect[side]) * 100;
    setPositionPercent(nextPositionPercent);
    if (index === 0) {
      setIndicatorPosition((prevPosition) => [nextPositionPercent, prevPosition[1]]);
    } else if (last) {
      setIndicatorPosition((prevPosition) => [prevPosition[0], nextPositionPercent]);
    }
  });

  useIsoLayoutEffect(() => {
    if (inset) {
      queueMicrotask(getInsetPosition);
    }
  }, [getInsetPosition, inset]);

  useIsoLayoutEffect(() => {
    if (inset) {
      getInsetPosition();
    }
  }, [getInsetPosition, inset, thumbValuePercent]);

  const getThumbStyle = React.useCallback(() => {
    const startEdge = vertical ? 'bottom' : 'insetInlineStart';
    const crossOffsetProperty = vertical ? 'left' : 'top';

    let zIndex: number | undefined;
    if (range) {
      if (activeIndex === index) {
        zIndex = 2;
      } else if (safeLastUsedThumbIndex === index) {
        zIndex = 1;
      }
    } else if (activeIndex === index) {
      zIndex = 1;
    }

    if (!inset) {
      if (!Number.isFinite(thumbValuePercent)) {
        return visuallyHidden;
      }

      return {
        position: 'absolute',
        [startEdge]: `${thumbValuePercent}%`,
        [crossOffsetProperty]: '50%',
        translate: `${(vertical || !rtl ? -1 : 1) * 50}% ${(vertical ? 1 : -1) * 50}%`,
        zIndex,
      } satisfies React.CSSProperties;
    }

    return {
      ['--position' as string]: `${positionPercent}%`,
      visibility:
        (renderBeforeHydration && !isMounted) || positionPercent === undefined
          ? 'hidden'
          : undefined,
      position: 'absolute',
      [startEdge]: 'var(--position)',
      [crossOffsetProperty]: '50%',
      translate: `${(vertical || !rtl ? -1 : 1) * 50}% ${(vertical ? 1 : -1) * 50}%`,
      zIndex,
    } satisfies React.CSSProperties;
  }, [
    activeIndex,
    index,
    inset,
    isMounted,
    positionPercent,
    range,
    renderBeforeHydration,
    rtl,
    safeLastUsedThumbIndex,
    thumbValuePercent,
    vertical,
  ]);

  let cssWritingMode: React.CSSProperties['writingMode'];
  if (orientation === 'vertical') {
    cssWritingMode = rtl ? 'vertical-rl' : 'vertical-lr';
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
          validation.commit(getSliderValue(thumbValue, index, min, max, range, sliderValues));
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
              rtl ? -1 : 1,
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
              rtl ? 1 : -1,
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
    validation.getInputValidationProps,
  );

  const mergedInputRef = useMergedRefs(inputRef, validation.inputRef, inputRefProp);

  const element = useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, listItemRef, thumbRef],
    props: [
      {
        [SliderThumbDataAttributes.index as string]: index,
        children: (
          <React.Fragment>
            {childrenProp}
            <input ref={mergedInputRef} {...inputProps} />
            {inset &&
              !isMounted &&
              renderBeforeHydration &&
              // this must be rendered with the last thumb to ensure all
              // preceding thumbs are already rendered in the DOM
              last && (
                <script
                  nonce={nonce}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{ __html: prehydrationScript }}
                  suppressHydrationWarning
                />
              )}
          </React.Fragment>
        ),
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
        suppressHydrationWarning: renderBeforeHydration || undefined,
        tabIndex: -1,
      },
      elementProps,
    ],
    stateAttributesMapping: sliderStateAttributesMapping,
  });

  return element;
});

export interface ThumbMetadata {
  inputId: LabelableContext['controlId'];
}

export interface SliderThumbState extends SliderRoot.State {}

export interface SliderThumbProps extends Omit<
  BaseUIComponentProps<'div', SliderThumb.State>,
  'onBlur' | 'onFocus'
> {
  /**
   * Whether the thumb should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * A function which returns a string value for the [`aria-label`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-label) attribute of the `input`.
   */
  getAriaLabel?: (((index: number) => string) | null) | undefined;
  /**
   * A function which returns a string value for the [`aria-valuetext`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-valuetext) attribute of the `input`.
   * This is important for screen reader users.
   */
  getAriaValueText?:
    | (((formattedValue: string, value: number, index: number) => string) | null)
    | undefined;
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
  inputRef?: React.Ref<HTMLInputElement> | undefined;
  /**
   * A blur handler forwarded to the `input`.
   */
  onBlur?: React.FocusEventHandler<HTMLInputElement> | undefined;
  /**
   * A focus handler forwarded to the `input`.
   */
  onFocus?: React.FocusEventHandler<HTMLInputElement> | undefined;
  /**
   * Optional tab index attribute forwarded to the `input`.
   */
  tabIndex?: number | undefined;
}

export namespace SliderThumb {
  export type State = SliderThumbState;
  export type Props = SliderThumbProps;
}
