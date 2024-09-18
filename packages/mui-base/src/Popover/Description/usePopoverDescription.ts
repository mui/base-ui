'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import type {
  UsePopoverDescriptionParameters,
  UsePopoverDescriptionReturnValue,
} from './usePopoverDescription.types';
import { useId } from '../../utils/useId';

export function usePopoverDescription(
  params: UsePopoverDescriptionParameters,
): UsePopoverDescriptionReturnValue {
  const { descriptionId, setDescriptionId } = params;

  const id = useId(descriptionId);

  const getDescriptionProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'p'>(externalProps, {
        id,
      });
    },
    [id],
  );

  useEnhancedEffect(() => {
    setDescriptionId(id);
    return () => {
      setDescriptionId(undefined);
    };
  }, [setDescriptionId, id]);

  return React.useMemo(
    () => ({
      getDescriptionProps,
    }),
    [getDescriptionProps],
  );
}
