'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { MeterRootContext } from './MeterRootContext';
import { mergeProps } from '../../merge-props';
import { BaseUIComponentProps } from '../../utils/types';
import { formatNumber } from '../../utils/formatNumber';
import { useLatestRef } from '../../utils/useLatestRef';
import { valueToPercent } from '../../utils/valueToPercent';
import { meterStyleHookMapping } from './styleHooks';

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

  const state: MeterRoot.State = React.useMemo(
    () => ({
      max,
      min,
    }),
    [max, min],
  );

  const contextValue: MeterRootContext = React.useMemo(
    () => ({
      formattedValue,
      max,
      min,
      percentageValue,
      setLabelId,
      state,
      value,
    }),
    [formattedValue, max, min, percentageValue, setLabelId, state, value],
  );

  const { renderElement } = useComponentRenderer({
    propGetter,
    render: render ?? 'div',
    state,
    className,
    ref: forwardedRef,
    extraProps: otherProps,
    customStyleHookMapping: meterStyleHookMapping,
  });

  return (
    <MeterRootContext.Provider value={contextValue}>{renderElement()}</MeterRootContext.Provider>
  );
});

namespace MeterRoot {
  export type State = {
    max: number;
    min: number;
  };

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

MeterRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Options to format the value.
   */
  format: PropTypes.shape({
    compactDisplay: PropTypes.oneOf(['long', 'short']),
    currency: PropTypes.string,
    currencyDisplay: PropTypes.oneOf(['code', 'name', 'narrowSymbol', 'symbol']),
    currencySign: PropTypes.oneOf(['accounting', 'standard']),
    localeMatcher: PropTypes.oneOf(['best fit', 'lookup']),
    maximumFractionDigits: PropTypes.number,
    maximumSignificantDigits: PropTypes.number,
    minimumFractionDigits: PropTypes.number,
    minimumIntegerDigits: PropTypes.number,
    minimumSignificantDigits: PropTypes.number,
    notation: PropTypes.oneOf(['compact', 'engineering', 'scientific', 'standard']),
    numberingSystem: PropTypes.string,
    signDisplay: PropTypes.oneOf(['always', 'auto', 'exceptZero', 'never']),
    style: PropTypes.oneOf(['currency', 'decimal', 'percent', 'unit']),
    unit: PropTypes.string,
    unitDisplay: PropTypes.oneOf(['long', 'narrow', 'short']),
    useGrouping: PropTypes.bool,
  }),
  /**
   * A function that returns a string value that provides a human-readable text alternative for the current value of the meter.
   * @param {string} formattedValue The formatted value
   * @param {number} value The raw value
   * @returns {string}
   */
  getAriaValueText: PropTypes.func,
  /**
   * The locale used by `Intl.NumberFormat` when formatting the value.
   * Defaults to the user's runtime locale.
   */
  locale: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.shape({
          baseName: PropTypes.string.isRequired,
          calendar: PropTypes.string,
          caseFirst: PropTypes.oneOf(['false', 'lower', 'upper']),
          collation: PropTypes.string,
          hourCycle: PropTypes.oneOf(['h11', 'h12', 'h23', 'h24']),
          language: PropTypes.string.isRequired,
          maximize: PropTypes.func.isRequired,
          minimize: PropTypes.func.isRequired,
          numberingSystem: PropTypes.string,
          numeric: PropTypes.bool,
          region: PropTypes.string,
          script: PropTypes.string,
          toString: PropTypes.func.isRequired,
        }),
        PropTypes.string,
      ]).isRequired,
    ),
    PropTypes.shape({
      baseName: PropTypes.string.isRequired,
      calendar: PropTypes.string,
      caseFirst: PropTypes.oneOf(['false', 'lower', 'upper']),
      collation: PropTypes.string,
      hourCycle: PropTypes.oneOf(['h11', 'h12', 'h23', 'h24']),
      language: PropTypes.string.isRequired,
      maximize: PropTypes.func.isRequired,
      minimize: PropTypes.func.isRequired,
      numberingSystem: PropTypes.string,
      numeric: PropTypes.bool,
      region: PropTypes.string,
      script: PropTypes.string,
      toString: PropTypes.func.isRequired,
    }),
    PropTypes.string,
  ]),
  /**
   * The maximum value
   * @default 100
   */
  max: PropTypes.number,
  /**
   * The minimum value
   * @default 0
   */
  min: PropTypes.number,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The current value.
   */
  value: PropTypes.number.isRequired,
} as any;
