'use client';
import * as React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { useSliderRoot } from '../root/useSliderRoot';

export function useSliderValue<Value>(
  parameters: useSliderValue.Parameters<Value>,
): useSliderValue.ReturnValue {
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
      return mergeReactProps(externalProps, {
        // off by default because it will keep announcing when the slider is being dragged
        // and also when the value is changing (but not yet committed)
        'aria-live': ariaLive,
        htmlFor: outputFor,
      });
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
  export interface Parameters<Value>
    extends Pick<useSliderRoot.ReturnValue<Value>, 'thumbMap' | 'values'> {
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
