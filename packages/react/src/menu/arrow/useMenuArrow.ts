'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';

export function useMenuArrow(params: useMenuArrow.Parameters): useMenuArrow.ReturnValue {
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

export namespace useMenuArrow {
  export interface Parameters {
    arrowStyles: React.CSSProperties;
  }

  export interface ReturnValue {
    getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
