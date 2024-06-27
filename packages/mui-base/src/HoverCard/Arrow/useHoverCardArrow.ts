'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UseHoverCardArrowParameters,
  UseHoverCardArrowReturnValue,
} from './useHoverCardArrow.types';

/**
 *
 * API:
 *
 * - [useHoverCardArrow API](https://mui.com/base-ui/api/use-hover-card-arrow/)
 */
export function useHoverCardArrow(
  params: UseHoverCardArrowParameters,
): UseHoverCardArrowReturnValue {
  const { arrowStyles } = params;

  const getArrowProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(externalProps, {
        style: arrowStyles,
      });
    },
    [arrowStyles],
  );

  return React.useMemo(
    () => ({
      getArrowProps,
    }),
    [getArrowProps],
  );
}
