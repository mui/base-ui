'use client';

import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import type {
  UsePopoverTitleParameters,
  UsePopoverTitleReturnValue,
} from './usePopoverTitle.types';
import { useId } from '../../utils/useId';

/**
 *
 * API:
 *
 * - [usePopoverTitle API](https://mui.com/base-ui/api/use-popover-title/)
 */
export function usePopoverTitle(params: UsePopoverTitleParameters): UsePopoverTitleReturnValue {
  const { titleId, setTitleId } = params;

  const id = useId(titleId);

  const getTitleProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'h2'>(externalProps, {
        id,
      });
    },
    [id],
  );

  useEnhancedEffect(() => {
    setTitleId(id);
    return () => {
      setTitleId(undefined);
    };
  }, [setTitleId, id]);

  return React.useMemo(
    () => ({
      getTitleProps,
    }),
    [getTitleProps],
  );
}
