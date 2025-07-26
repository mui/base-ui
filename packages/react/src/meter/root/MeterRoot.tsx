'use client';
import * as React from 'react';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { MeterRootContext } from './MeterRootContext';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { formatNumber } from '../../utils/formatNumber';
import { useRenderElement } from '../../utils/useRenderElement';

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
export const MeterRoot = React.forwardRef(function MeterRoot(
  componentProps: MeterRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    format,
    getAriaValueText,
    locale,
    max = 100,
    min = 0,
    value: valueProp,
    render,
    className,
    ...elementProps
  } = componentProps;

  const formatOptionsRef = useLatestRef(format);

  const [labelId, setLabelId] = React.useState<string | undefined>();
  const formattedValue = formatValue(valueProp, locale, formatOptionsRef.current);

  let ariaValuetext = `${valueProp}%`;
  if (getAriaValueText) {
    ariaValuetext = getAriaValueText(formattedValue, valueProp);
  } else if (format) {
    ariaValuetext = formattedValue;
  }

  const defaultProps: HTMLProps = {
    'aria-labelledby': labelId,
    'aria-valuemax': max,
    'aria-valuemin': min,
    'aria-valuenow': valueProp,
    'aria-valuetext': ariaValuetext,
    role: 'meter',
  };

  const contextValue: MeterRootContext = React.useMemo(
    () => ({
      formattedValue,
      max,
      min,
      setLabelId,
      value: valueProp,
    }),
    [formattedValue, max, min, setLabelId, valueProp],
  );

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [defaultProps, elementProps],
  });

  return <MeterRootContext.Provider value={contextValue}>{element}</MeterRootContext.Provider>;
});

export namespace MeterRoot {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * A string value that provides a user-friendly name for `aria-valuenow`, the current value of the meter.
     */
    'aria-valuetext'?: React.AriaAttributes['aria-valuetext'];
    /**
     * Options to format the value.
     */
    format?: Intl.NumberFormatOptions;
    /**
     * A function that returns a string value that provides a human-readable text alternative for `aria-valuenow`, the current value of the meter.
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
