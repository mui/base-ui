'use client';

import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { UsePreviewCardBackdropReturnValue } from './usePreviewCardBackdrop.types';

/**
 *
 * API:
 *
 * - [usePreviewCardBackdrop API](https://mui.com/base-ui/api/use-preview-card-backdrop/)
 */
export function usePreviewCardBackdrop(): UsePreviewCardBackdropReturnValue {
  const getBackdropProps = React.useCallback((externalProps = {}) => {
    return mergeReactProps<'div'>(externalProps, {
      style: {
        zIndex: 2147483647, // max z-index
        overflow: 'auto',
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
      },
    });
  }, []);

  return React.useMemo(
    () => ({
      getBackdropProps,
    }),
    [getBackdropProps],
  );
}
