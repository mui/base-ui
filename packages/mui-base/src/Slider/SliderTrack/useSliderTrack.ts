'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { UseSliderTrackParameters, UseSliderTrackReturnValue } from './SliderTrack.types';
/**
 *
 * API:
 *
 * - [useSliderTrack API](https://mui.com/base-ui/api/use-slider-track/)
 */
function useSliderTrack(parameters: UseSliderTrackParameters): UseSliderTrackReturnValue {
  const { rootRef } = parameters;

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        ref: rootRef,
      });
    },
    [rootRef],
  );

  return React.useMemo(
    () => ({
      getRootProps,
    }),
    [getRootProps],
  );
}

export { useSliderTrack };
