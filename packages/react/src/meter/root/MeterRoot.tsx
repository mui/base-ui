'use client';
import * as React from 'react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { MeterRootContext } from './MeterRootContext';
import { mergeProps } from '../../merge-props';
import { BaseUIComponentProps } from '../../utils/types';
import { formatNumber } from '../../utils/formatNumber';
import { useLatestRef } from '../../utils/useLatestRef';
import { valueToPercent } from '../../utils/valueToPercent';

const EMPTY = {};

function formatValue(
  value: number,
  locale?: Intl.LocalesArgument,
  format?: Intl.NumberFormatOptions,
): string {
  if (!format) {
    return formatNumber(value / 100, locale, { style: 'percent' });
  }

  return formatNumber(value, locale, format);
}
/**
 * Groups all parts of the meter and provides the value for screen readers.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Meter](https://base-ui.com/react/components/meter)
 */
const MeterRoot = React.forwardRef(function MeterRoot(
  props: MeterRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    format,
    getAriaValueText,
    locale,
    max = 100,
    min = 0,
    value,
    render,
    className,
    ...otherProps
  } = props;

  const formatOptionsRef = useLatestRef(format);

  const [labelId, setLabelId] = React.useState<string | undefined>();

  const percentageValue = valueToPercent(value, min, max);

  const formattedValue = formatValue(value, locale, formatOptionsRef.current);

  const propGetter = React.useCallback(
    (externalProps = {}) => {
      let ariaValuetext = `${percentageValue}%`;
      if (getAriaValueText) {
        ariaValuetext = getAriaValueText(formattedValue, value);
      } else if (format) {
        ariaValuetext = formattedValue;
      }
      return mergeProps<'div'>(
        {
          'aria-labelledby': labelId,
          'aria-valuemax': max,
          'aria-valuemin': min,
          'aria-valuenow': percentageValue / 100,
          'aria-valuetext': ariaValuetext,
          role: 'meter',
        },
        externalProps,
      );
    },
    [format, formattedValue, getAriaValueText, labelId, max, min, value, percentageValue],
  );

  const contextValue: MeterRootContext = React.useMemo(
    () => ({
      formattedValue,
      max,
      min,
      percentageValue,
      setLabelId,
      value,
    }),
    [formattedValue, max, min, percentageValue, setLabelId, value],
  );

  const { renderElement } = useComponentRenderer({
    propGetter,
    render: render ?? 'div',
    state: EMPTY,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
  });

  return (
    <MeterRootContext.Provider value={contextValue}>{renderElement()}</MeterRootContext.Provider>
  );
});

namespace MeterRoot {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Options to format the value.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * A function that returns a string value that provides a human-readable text alternative for the current value of the meter.
     * @param {string} formattedValue The formatted value
     * @param {number} value The raw value
     * @returns {string}
     */
    getAriaValueText?: (formattedValue: string, value: number) => string;
    /**
     * The locale used by `Intl.NumberFormat` when formatting the value.
     * Defaults to the user's runtime locale.
     */
    locale?: Intl.LocalesArgument;
    /**
     * The maximum value
     * @default 100
     */
    max?: number;
    /**
     * The minimum value
     * @default 0
     */
    min?: number;
    /**
     * The current value.
     */
    value: number;
  }
}

export { MeterRoot };
