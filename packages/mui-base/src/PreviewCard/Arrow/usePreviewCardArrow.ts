'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UsePreviewCardArrowParameters,
  UsePreviewCardArrowReturnValue,
} from './usePreviewCardArrow.types';

/**
 *
 * API:
 *
 * - [usePreviewCardArrow API](https://mui.com/base-ui/api/use-preview-card-arrow/)
 */
export function usePreviewCardArrow(
  params: UsePreviewCardArrowParameters,
): UsePreviewCardArrowReturnValue {
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
