'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps.js';
import { ProgressDirection } from '../Root/useProgressRoot.js';

function valueToPercent(value: number, min: number, max: number) {
  return ((value - min) * 100) / (max - min);
}

function useProgressIndicator(
  parameters: useProgressIndicator.Parameters,
): useProgressIndicator.ReturnValue {
  const { direction, max = 100, min = 0, value } = parameters;

  const isRtl = direction === 'rtl';

  const percentageValue =
    Number.isFinite(value) && value !== null ? valueToPercent(value, min, max) : null;

  const getStyles = React.useCallback(() => {
    if (!percentageValue) {
      return {};
    }

    return {
      [isRtl ? 'right' : 'left']: 0,
      height: 'inherit',
      width: `${percentageValue}%`,
    };
  }, [isRtl, percentageValue]);

  const getRootProps: useProgressIndicator.ReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'span'>(externalProps, {
        style: getStyles(),
      }),
    [getStyles],
  );

  return {
    getRootProps,
  };
}

namespace useProgressIndicator {
  export interface Parameters {
    /**
     * The direction that progress bars fill in
     * @default 'ltr'
     */
    direction?: ProgressDirection;
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
     * The current value. The component is indeterminate when value is `null`.
     */
    value: number | null;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'span'>,
    ) => React.ComponentPropsWithRef<'span'>;
  }
}

export { useProgressIndicator };
