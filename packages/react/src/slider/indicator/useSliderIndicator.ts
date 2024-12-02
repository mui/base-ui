'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';
import type { useSliderRoot } from '../root/useSliderRoot';

function getRangeStyles(orientation: useSliderRoot.Orientation, offset: number, leap: number) {
  if (orientation === 'vertical') {
    return {
      position: 'absolute',
      bottom: `${offset}%`,
      height: `${leap}%`,
      width: 'inherit',
    };
  }

  return {
    position: 'absolute',
    insetInlineStart: `${offset}%`,
    width: `${leap}%`,
    height: 'inherit',
  };
}

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

  let internalStyles;

  if (percentageValues.length > 1) {
    const trackOffset = percentageValues[0];
    const trackLeap = percentageValues[percentageValues.length - 1] - trackOffset;

    internalStyles = getRangeStyles(orientation, trackOffset, trackLeap);
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
