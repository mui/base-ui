'use client';
import * as React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { getStyleHookProps } from '../../utils/getStyleHookProps';
import { mergeProps } from '../../merge-props';
import { isReactVersionAtLeast } from '../../utils/reactVersion';
import { resolveClassName } from '../../utils/resolveClassName';
import { BaseUIComponentProps } from '../../utils/types';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useForkRef } from '../../utils/useForkRef';
import { visuallyHidden } from '../../utils/visuallyHidden';
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
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { getSliderValue } from '../utils/getSliderValue';
import { roundValueToStep } from '../utils/roundValueToStep';
import { valueArrayToPercentages } from '../utils/valueArrayToPercentages';
import type { SliderRoot } from '../root/SliderRoot';
import { useSliderRootContext } from '../root/SliderRootContext';
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

function defaultRender(
  props: React.ComponentPropsWithRef<'div'>,
  inputProps: React.ComponentPropsWithRef<'input'>,
) {
  const { children, ...thumbProps } = props;
  return (
    <div {...thumbProps}>
      {children}
      <input {...inputProps} />
    </div>
  );
}

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
    render: renderProp,
    className,
    disabled: disabledProp = false,
    getAriaLabel: getAriaLabelProp,
    getAriaValueText: getAriaValueTextProp,
    id: idProp,
    onBlur: onBlurProp,
    onFocus: onFocusProp,
    onKeyDown: onKeyDownProp,
    tabIndex: tabIndexProp,
    ...elementProps
  } = componentProps;

  const id = useBaseUiId(idProp);
  const inputId = `${id}-input`;

  const render = renderProp ?? defaultRender;

  const {
    active: activeIndex,
    handleInputChange,
    disabled: contextDisabled,
    formatOptionsRef,
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

  let renderPropRef = null;
  if (typeof render !== 'function') {
    renderPropRef = isReactVersionAtLeast(19) ? (render.props as any).ref : render.ref;
  }

  const disabled = disabledProp || contextDisabled;

  const externalTabIndex = tabIndexProp ?? contextTabIndex;

  const direction = useDirection();
  const { setTouched, setFocused, validationMode } = useFieldRootContext();
  const { commitValidation } = useFieldControlValidation();

  const thumbRef = React.useRef<HTMLElement>(null);

  const thumbMetadata = React.useMemo(
    () => ({
      inputId,
    }),
    [inputId],
  );

  const { ref: listItemRef, index } = useCompositeListItem<ThumbMetadata>({
    metadata: thumbMetadata,
  });

  const mergedThumbRef = useForkRef(renderPropRef, forwardedRef, listItemRef, thumbRef);

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

  const styleHooks = React.useMemo(
    () => getStyleHookProps({ disabled, dragging: index !== -1 && activeIndex === index }),
    [activeIndex, disabled, index],
  );

  const thumbProps = mergeProps(
    {
      [SliderThumbDataAttributes.index]: index,
      className: resolveClassName(className, state),
      id,
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
          commitValidation(
            getSliderValue(thumbValue, index, min, max, sliderValues.length > 1, sliderValues),
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
      ref: mergedThumbRef,
      style: getThumbStyle(),
      tabIndex: externalTabIndex ?? (disabled ? undefined : 0),
    },
    styleHooks,
    elementProps,
  );

  let cssWritingMode: React.CSSProperties['writingMode'];
  if (orientation === 'vertical') {
    cssWritingMode = isRtl ? 'vertical-rl' : 'vertical-lr';
  }

  const inputProps = mergeProps<'input'>({
    'aria-label':
      typeof getAriaLabelProp === 'function' ? getAriaLabelProp(index) : elementProps['aria-label'],
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
    [SliderThumbDataAttributes.index as string]: index,
    disabled,
    id: inputId,
    max,
    min,
    onChange(event: React.ChangeEvent<HTMLInputElement>) {
      handleInputChange(event.target.valueAsNumber, index, event);
    },
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
  });

  if (typeof render === 'function') {
    return render(thumbProps, inputProps, state);
  }

  const { children: renderPropsChildren, ...otherRenderProps } =
    render.props as React.PropsWithChildren<unknown>;

  const children = thumbProps.children ?? renderPropsChildren;

  return React.cloneElement(
    render,
    mergeProps(
      thumbProps,
      {
        children: (
          <React.Fragment>
            {/* @ts-ignore */}
            {typeof children === 'function' ? children() : children}
            <input {...inputProps} />
          </React.Fragment>
        ),
      },
      otherRenderProps,
      {
        ref: thumbProps.ref,
      },
    ),
  );
});

export interface ThumbMetadata {
  inputId: string | undefined;
}

export namespace SliderThumb {
  export interface State extends SliderRoot.State {}

  export interface Props extends Omit<BaseUIComponentProps<'div', State>, 'render'> {
    /**
     * Whether the thumb should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
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
    getAriaValueText?: ((formattedValue: string, value: number, index: number) => string) | null;
    /**
     * Allows you to replace the component’s HTML element
     * with a different tag, or compose it with another component.
     *
     * Accepts a `ReactElement` or a function that returns the element to render.
     */
    render?:
      | ((
          props: React.ComponentPropsWithRef<'div'>,
          inputProps: React.ComponentPropsWithRef<'input'>,
          state: State,
        ) => React.ReactElement)
      | (React.ReactElement & { ref: React.Ref<Element> });
  }
}
