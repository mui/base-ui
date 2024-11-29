'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSelectRootContext } from '../root/SelectRootContext';

/**
 *
 * API:
 *
 * - [useSelectBackdrop API](https://mui.com/base-ui/api/use-select-backdrop/)
 */
export function useSelectBackdrop() {
  const { mounted } = useSelectRootContext();

  const getBackdropProps = React.useCallback(
    (externalProps = {}) => {
      const hidden = !mounted;
      return mergeReactProps<'div'>(externalProps, {
        role: 'presentation',
        hidden,
        style: {
          overflow: 'auto',
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
        },
      });
    },
    [mounted],
  );

  return React.useMemo(
    () => ({
      getBackdropProps,
    }),
    [getBackdropProps],
  );
}
