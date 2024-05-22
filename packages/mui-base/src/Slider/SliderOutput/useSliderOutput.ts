'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSliderContext } from '../Root/SliderProvider';
import { UseSliderOutputParameters, UseSliderOutputReturnValue } from './SliderOutput.types';
/**
 *
 * API:
 *
 * - [useSliderOutput API](https://mui.com/base-ui/api/use-slider-output/)
 */
function useSliderOutput(parameters: UseSliderOutputParameters): UseSliderOutputReturnValue {
  const { 'aria-live': ariaLive = 'off', rootRef } = parameters;

  const { subitems } = useSliderContext();

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
        ref: rootRef,
        ...externalProps,
      });
    },
    [ariaLive, outputFor, rootRef],
  );

  return React.useMemo(
    () => ({
      getRootProps,
    }),
    [getRootProps],
  );
}

export { useSliderOutput };
