'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { valueToPercent } from '../../utils/valueToPercent';
import { MeterDirection } from '../Root/useMeterRoot';

function useMeterIndicator(
  parameters: useMeterIndicator.Parameters,
): useMeterIndicator.ReturnValue {
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
      width: `${percentageValue}%`,
    };
  }, [isRtl, percentageValue]);

  const getRootProps: useMeterIndicator.ReturnValue['getRootProps'] = React.useCallback(
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

namespace useMeterIndicator {
  export interface Parameters {
    /**
     * The direction that the meter fills towards
     * @default 'ltr'
     */
    direction?: MeterDirection;
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
    value: number | null;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'span'>,
    ) => React.ComponentPropsWithRef<'span'>;
  }
}

export { useMeterIndicator };
