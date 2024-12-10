'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';
import type { useSliderRoot } from '../root/useSliderRoot';

const axisProps = {
  horizontal: {
    offset: (percent: number) => ({ left: `${percent}%` }),
    leap: (percent: number) => ({ width: `${percent}%`, height: 'inherit' }),
  },
  'horizontal-reverse': {
    offset: (percent: number) => ({ right: `${percent}%` }),
    leap: (percent: number) => ({ width: `${percent}%`, height: 'inherit' }),
  },
  vertical: {
    offset: (percent: number) => ({ bottom: `${percent}%` }),
    leap: (percent: number) => ({ height: `${percent}%`, width: 'inherit' }),
  },
};

/**
 */
export function useSliderIndicator(
  parameters: useSliderIndicator.Parameters,
): useSliderIndicator.ReturnValue {
  const { axis, direction, orientation, percentageValues } = parameters;

  const isRange = percentageValues.length > 1;

  const isRtl = direction === 'rtl';

  let internalStyles;

  if (isRange) {
    const trackOffset = percentageValues[0];
    const trackLeap = percentageValues[percentageValues.length - 1] - trackOffset;

    internalStyles = {
      position: 'absolute',
      ...axisProps[axis].offset(trackOffset),
      ...axisProps[axis].leap(trackLeap),
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
      [isRtl ? 'right' : 'left']: 0,
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
    extends Pick<
      useSliderRoot.ReturnValue,
      'axis' | 'direction' | 'disabled' | 'orientation' | 'percentageValues'
    > {}

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
