'use client';
import * as React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { useSliderRoot } from '../root/useSliderRoot';

export function useSliderValue(parameters: useSliderValue.Parameters): useSliderValue.ReturnValue {
  const { 'aria-live': ariaLive = 'off', format: formatParam, inputIdMap, values } = parameters;

  const outputFor = React.useMemo(() => {
    const size = inputIdMap.size;
    let htmlFor = '';
    for (let i = 0; i < size; i += 1) {
      const inputId = inputIdMap.get(i);
      if (!inputId) {
        break;
      }
      htmlFor += `${inputId} `;
    }
    return htmlFor.trim() === '' ? undefined : htmlFor.trim();
  }, [inputIdMap]);

  const formattedValues = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < values.length; i += 1) {
      arr.push(
        formatNumber(values[i], [], Array.isArray(formatParam) ? formatParam[i] : formatParam),
      );
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
  export interface Parameters extends Pick<useSliderRoot.ReturnValue, 'inputIdMap' | 'values'> {
    'aria-live'?: React.AriaAttributes['aria-live'];
    /**
     * Options to format the input value.
     */
    format?: Intl.NumberFormatOptions | Intl.NumberFormatOptions[];
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
