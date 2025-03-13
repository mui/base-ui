'use client';
import * as React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { mergeProps } from '../../merge-props';
import type { useSliderRoot } from '../root/useSliderRoot';

export function useSliderValue(parameters: useSliderValue.Parameters): useSliderValue.ReturnValue {
  const { 'aria-live': ariaLive, format: formatParam, thumbMap, values } = parameters;

  const outputFor = React.useMemo(() => {
    let htmlFor = '';
    for (const thumbMetadata of thumbMap.values()) {
      if (thumbMetadata?.inputId) {
        htmlFor += `${thumbMetadata.inputId} `;
      }
    }
    return htmlFor.trim() === '' ? undefined : htmlFor.trim();
  }, [thumbMap]);

  const formattedValues = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < values.length; i += 1) {
      arr.push(formatNumber(values[i], [], formatParam ?? undefined));
    }
    return arr;
  }, [formatParam, values]);

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      return mergeProps<'output'>(
        {
          // off by default because it will keep announcing when the slider is being dragged
          // and also when the value is changing (but not yet committed)
          'aria-live': ariaLive,
          htmlFor: outputFor,
        },
        externalProps,
      );
    },
    [ariaLive, outputFor],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      formattedValues,
    }),
    [getRootProps, formattedValues],
  );
}

export namespace useSliderValue {
  export interface Parameters extends Pick<useSliderRoot.ReturnValue, 'thumbMap' | 'values'> {
    'aria-live': React.AriaAttributes['aria-live'];
    /**
     * Options to format the input value.
     * @default null
     */
    format: Intl.NumberFormatOptions | null;
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'output'>,
    ) => React.ComponentPropsWithRef<'output'>;
    /**
     * The formatted value(s) of the slider
     */
    formattedValues: readonly string[];
  }
}
