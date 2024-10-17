'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { MeterDirection } from '../root/useMeterRoot';

function useMeterIndicator(
  parameters: useMeterIndicator.Parameters,
): useMeterIndicator.ReturnValue {
  const { direction, percentageValue } = parameters;

  const isRtl = direction === 'rtl';

  const getStyles = React.useCallback(() => {
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
     * The current value.
     */
    percentageValue: number;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'span'>,
    ) => React.ComponentPropsWithRef<'span'>;
  }
}

export { useMeterIndicator };
