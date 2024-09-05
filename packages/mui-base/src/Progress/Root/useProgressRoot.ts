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
}

function useProgressRoot(parameters: UseProgressRootParameters): UseProgressRootReturnValue {
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledby,
    'aria-valuetext': ariaValuetext,
    direction = 'ltr',
    getAriaLabel,
    getAriaValueText,
    max = 100,
    min = 0,
    value,
  } = parameters;

  let state: ProgressStatus = 'indeterminate';
  if (Number.isFinite(value)) {
    state = value === max ? 'complete' : 'progressing';
  }

  const getRootProps: UseProgressRootReturnValue['getRootProps'] = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-label': getAriaLabel ? getAriaLabel(value) : ariaLabel,
        'aria-labelledby': ariaLabelledby,
        'aria-valuemax': max,
        'aria-valuemin': min,
        'aria-valuenow': value ?? undefined,
        'aria-valuetext': getAriaValueText
          ? getAriaValueText(value)
          : ariaValuetext ?? getDefaultAriaValueText(value),
        dir: direction,
        role: 'progressbar',
      }),
    [
      ariaLabel,
      ariaLabelledby,
      ariaValuetext,
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
    value,
    state,
  };
}

export { useProgressRoot };
