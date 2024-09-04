'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import {
  UseProgressIndicatorParameters,
  UseProgressIndicatorReturnValue,
} from './ProgressIndicator.types';

function valueToPercent(value: number, min: number, max: number) {
  return ((value - min) * 100) / (max - min);
}
/**
 *
 * Demos:
 *
 * - [Progress](https://mui.com/base-ui/react-progress/#hooks)
 *
 * API:
 *
 * - [useProgressIndicator API](https://mui.com/base-ui/react-progress/hooks-api/#use-progress-indicator)
 */
function useProgressIndicator(
  parameters: UseProgressIndicatorParameters,
): UseProgressIndicatorReturnValue {
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

  const getRootProps: UseProgressIndicatorReturnValue['getRootProps'] = React.useCallback(
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

export { useProgressIndicator };
