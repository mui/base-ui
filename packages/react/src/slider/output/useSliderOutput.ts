'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { useSliderRoot } from '../root/useSliderRoot';

export function useSliderOutput(
  parameters: useSliderOutput.Parameters,
): useSliderOutput.ReturnValue {
  const { 'aria-live': ariaLive = 'off', inputIdMap } = parameters;

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
    }),
    [getRootProps],
  );
}

export namespace useSliderOutput {
  export interface Parameters extends Pick<useSliderRoot.ReturnValue, 'inputIdMap'> {
    'aria-live'?: React.AriaAttributes['aria-live'];
  }

  export interface ReturnValue {
    getRootProps: (
      externalProps?: React.ComponentPropsWithRef<'output'>,
    ) => React.ComponentPropsWithRef<'output'>;
  }
}
