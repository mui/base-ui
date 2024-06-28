'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { UseProgressBufferParameters, UseProgressBufferReturnValue } from './ProgressBuffer.types';

function valueToPercent(value: number | undefined, min: number, max: number) {
  if (value === undefined) {
    return value;
  }

  return ((value - min) * 100) / (max - min);
}
/**
 *
 * API:
 *
 * - [useProgressBuffer API](https://mui.com/base-ui/api/use-progress-buffer/)
 */
function useProgressBuffer(parameters: UseProgressBufferParameters): UseProgressBufferReturnValue {
  const { direction, max = 100, min = 0, bufferValue } = parameters;

  const isRtl = direction === 'rtl';

  const percentageValue = valueToPercent(bufferValue, min, max);

  const getStyles = React.useCallback(() => {
    return {
      [isRtl ? 'right' : 'left']: 0,
      width: percentageValue ? `${percentageValue}%` : undefined,
    };
  }, [isRtl, percentageValue]);

  const getRootProps: UseProgressBufferReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'span'>(externalProps, {
        style: {
          height: 'inherit',
          position: 'absolute',
          zIndex: 0,
          ...getStyles(),
        },
      }),
    [getStyles],
  );

  return {
    getRootProps,
  };
}

export { useProgressBuffer };
