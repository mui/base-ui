'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';

function useMeterIndicator(
  parameters: useMeterIndicator.Parameters,
): useMeterIndicator.ReturnValue {
  const { percentageValue } = parameters;

  const getStyles = React.useCallback(() => {
    return {
      insetInlineStart: 0,
      width: `${percentageValue}%`,
    };
  }, [percentageValue]);

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
