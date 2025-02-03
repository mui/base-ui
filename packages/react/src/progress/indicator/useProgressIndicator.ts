'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { valueToPercent } from '../../utils/valueToPercent';

function useProgressIndicator(
  parameters: useProgressIndicator.Parameters,
): useProgressIndicator.ReturnValue {
  const { max = 100, min = 0, value } = parameters;

  const percentageValue =
    Number.isFinite(value) && value !== null ? valueToPercent(value, min, max) : null;

  const getStyles = React.useCallback(() => {
    if (percentageValue == null) {
      return {};
    }

    return {
      insetInlineStart: 0,
      height: 'inherit',
      width: `${percentageValue}%`,
    };
  }, [percentageValue]);

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
