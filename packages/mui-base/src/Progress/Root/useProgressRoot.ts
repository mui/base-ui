'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import {
  ProgressStatus,
  UseProgressRootParameters,
  UseProgressRootReturnValue,
} from './ProgressRoot.types';

function getDefaultAriaValueText(value: number | null) {
  if (value === null) {
    return 'indeterminate progress';
  }

  return `${value}%`;
} /**
 *
 * API:
 *
 * - [useProgressRoot API](https://mui.com/base-ui/api/use-progress-root/)
 */
function useProgressRoot(parameters: UseProgressRootParameters): UseProgressRootReturnValue {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    bufferValue,
    direction = 'ltr',
    getAriaLabel,
    getAriaValueText,
    max = 100,
    min = 0,
    value,
  } = parameters;

  let state: ProgressStatus = 'indeterminate';
  if (Number.isFinite(value)) {
    state = value === max ? 'complete' : 'loading';
  }

  const getRootProps: UseProgressRootReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-label': getAriaLabel ? getAriaLabel(value) : ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-valuemax': bufferValue ? Math.min(bufferValue, max) : max,
        'aria-valuemin': min,
        'aria-valuenow': value ?? undefined,
        'aria-valuetext': getAriaValueText
          ? getAriaValueText(value, bufferValue)
          : ariaValuetext ?? getDefaultAriaValueText(value),
        dir: direction,
        role: 'progressbar',
      }),
    [
      ariaLabel,
      ariaLabelledby,
      ariaValuetext,
      bufferValue,
      direction,
      getAriaLabel,
      getAriaValueText,
      max,
      min,
      value,
    ],
  );

  return {
    getRootProps,
    direction,
    max,
    min,
    bufferValue,
    value,
    state,
  };
}

export { useProgressRoot };
