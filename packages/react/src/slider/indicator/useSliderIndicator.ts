'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';
import type { useSliderRoot } from '../root/useSliderRoot';

const rangeStyles = {
  horizontal: {
    offset: (percent: number) => ({ insetInlineStart: `${percent}%` }),
    leap: (percent: number) => ({ width: `${percent}%`, height: 'inherit' }),
  },
  vertical: {
    offset: (percent: number) => ({ bottom: `${percent}%` }),
    leap: (percent: number) => ({ height: `${percent}%`, width: 'inherit' }),
  },
};

/**
 *
 * Demos:
 *
 * - [Slider](https://mui.com/base-ui/react-slider/#hooks)
 *
 * API:
 *
 * - [useSliderIndicator API](https://mui.com/base-ui/react-slider/hooks-api/#use-slider-indicator)
 */
export function useSliderIndicator(
  parameters: useSliderIndicator.Parameters,
): useSliderIndicator.ReturnValue {
  const { orientation, percentageValues } = parameters;

  const isRange = percentageValues.length > 1;

  let internalStyles;

  if (isRange) {
    const trackOffset = percentageValues[0];
    const trackLeap = percentageValues[percentageValues.length - 1] - trackOffset;

    internalStyles = {
      position: 'absolute',
      ...rangeStyles[orientation].offset(trackOffset),
      ...rangeStyles[orientation].leap(trackLeap),
    };
  } else if (orientation === 'vertical') {
    internalStyles = {
      position: 'absolute',
      bottom: 0,
      height: `${percentageValues[0]}%`,
      width: 'inherit',
    };
  } else {
    internalStyles = {
      position: 'absolute',
      insetInlineStart: 0,
      width: `${percentageValues[0]}%`,
      height: 'inherit',
    };
  }

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        style: internalStyles,
      });
    },
    [internalStyles],
  );

  return React.useMemo(
    () => ({
      getRootProps,
    }),
    [getRootProps],
  );
}

export namespace useSliderIndicator {
  export interface Parameters
    extends Pick<useSliderRoot.ReturnValue, 'disabled' | 'orientation' | 'percentageValues'> {}

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
