'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';
import type { useSliderRoot } from '../root/useSliderRoot';

function getRangeStyles(orientation: useSliderRoot.Orientation, offset: number, leap: number) {
  if (orientation === 'vertical') {
    return {
      position: 'relative',
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

  let internalStyles;

  if (percentageValues.length > 1) {
    const trackOffset = percentageValues[0];
    const trackLeap = percentageValues[percentageValues.length - 1] - trackOffset;

    internalStyles = getRangeStyles(orientation, trackOffset, trackLeap);
  } else if (orientation === 'vertical') {
    internalStyles = {
      position: 'relative',
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
      'direction' | 'disabled' | 'orientation' | 'percentageValues'
    > {}

  export interface ReturnValue {
    getRootProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
