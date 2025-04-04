'use client';
import * as React from 'react';
import { mergeProps } from '../../merge-props';
import type { GenericHTMLProps } from '../../utils/types';
import type { useSliderRoot } from '../root/useSliderRoot';

function getRangeStyles(
  orientation: useSliderRoot.Orientation,
  offset: number,
  leap: number,
): React.CSSProperties {
  if (orientation === 'vertical') {
    return {
      position: 'absolute',
      bottom: `${offset}%`,
      height: `${leap}%`,
      width: 'inherit',
    };
  }

  return {
    position: 'relative',
    insetInlineStart: `${offset}%`,
    width: `${leap}%`,
    height: 'inherit',
  };
}

/**
 */
export function useSliderIndicator(
  parameters: useSliderIndicator.Parameters,
): useSliderIndicator.ReturnValue {
  const { orientation, percentageValues } = parameters;

  let internalStyles: React.CSSProperties;

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
      position: 'relative',
      insetInlineStart: 0,
      width: `${percentageValues[0]}%`,
      height: 'inherit',
    };
  }

  const getRootProps = React.useCallback(
    (externalProps = {}) => {
      return mergeProps(
        {
          style: internalStyles,
        },
        externalProps,
      );
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
