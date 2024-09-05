'use client';

import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { UseSliderOutputParameters, UseSliderOutputReturnValue } from './SliderOutput.types';

function useSliderOutput(parameters: UseSliderOutputParameters): UseSliderOutputReturnValue {
  const { 'aria-live': ariaLive = 'off', subitems } = parameters;

  const outputFor = Array.from(subitems.values()).reduce((acc, item) => {
    return `${acc} ${item.inputId}`;
  }, '');

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        // off by default because it will keep announcing when the slider is being dragged
        // and also when the value is changing (but not yet committed)
        'aria-live': ariaLive,
        htmlFor: outputFor.trim(),
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

export { useSliderOutput };
