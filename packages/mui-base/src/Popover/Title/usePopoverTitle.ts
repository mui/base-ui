'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useId } from '../../utils/useId';
import type { GenericHTMLProps } from '../../utils/types';

export function usePopoverTitle(params: usePopoverTitle.Parameters): usePopoverTitle.ReturnValue {
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

namespace usePopoverTitle {
  export interface Parameters {
    titleId: string | undefined;
    setTitleId: React.Dispatch<React.SetStateAction<string | undefined>>;
  }
  export interface ReturnValue {
    getTitleProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
