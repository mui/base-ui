'use client';
import * as React from 'react';
import { visuallyHidden } from '@base-ui/utils/visuallyHidden';
import { MeterRootContext } from './MeterRootContext';
import { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { formatNumberValue } from '../../utils/formatNumber';
import { useRenderElement } from '../../utils/useRenderElement';

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
    children,
    ...elementProps
  } = componentProps;

  const [labelId, setLabelId] = React.useState<string | undefined>();
  const formattedValue = formatNumberValue(valueProp, locale, format);

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
    children: (
      <React.Fragment>
        {children}
        <span role="presentation" style={visuallyHidden}>
          {/* force NVDA to read the label https://github.com/mui/base-ui/issues/4184 */}x
        </span>
      </React.Fragment>
    ),
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
export interface MeterRootState {}
export interface MeterRootProps extends BaseUIComponentProps<'div', MeterRoot.State> {
  /**
   * A string value that provides a user-friendly name for `aria-valuenow`, the current value of the meter.
   */
  'aria-valuetext'?: React.AriaAttributes['aria-valuetext'] | undefined;
  /**
   * Options to format the value.
   */
  format?: Intl.NumberFormatOptions | undefined;
  /**
   * A function that returns a string value that provides a human-readable text alternative for `aria-valuenow`, the current value of the meter.
   */
  getAriaValueText?: ((formattedValue: string, value: number) => string) | undefined;
  /**
   * The locale used by `Intl.NumberFormat` when formatting the value.
   * Defaults to the user's runtime locale.
   */
  locale?: Intl.LocalesArgument | undefined;
  /**
   * The maximum value
   * @default 100
   */
  max?: number | undefined;
  /**
   * The minimum value
   * @default 0
   */
  min?: number | undefined;
  /**
   * The current value.
   */
  value: number;
}

export namespace MeterRoot {
  export type State = MeterRootState;
  export type Props = MeterRootProps;
}
