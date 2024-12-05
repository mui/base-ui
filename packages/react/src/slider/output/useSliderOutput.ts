'use client';
import * as React from 'react';
import { formatNumber } from '../../utils/formatNumber';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { useSliderRoot } from '../root/useSliderRoot';

export function useSliderOutput(
  parameters: useSliderOutput.Parameters,
): useSliderOutput.ReturnValue {
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

  let formattedValues;

  if (values.length > 1) {
    formattedValues = [];
    for (let i = 0; i < values.length; i += 1) {
      formattedValues.push(
        formatNumber(values[i], [], Array.isArray(formatParam) ? formatParam[i] : formatParam),
      );
    }
  } else {
    formattedValues = formatNumber(
      values[0],
      [],
      Array.isArray(formatParam) ? formatParam[0] : formatParam,
    );
  }

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
      formattedValues: Array.isArray(formattedValues)
        ? formattedValues.join(' – ')
        : formattedValues,
    }),
    [getRootProps, formattedValues],
  );
}

export namespace useSliderOutput {
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
     * A formatted string value for display.
     */
    formattedValues: string;
  }
}
