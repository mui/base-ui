'use client';

import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UseTooltipPopupParameters,
  UseTooltipPopupReturnValue,
} from './useTooltipPopup.types';

export function useTooltipPopup(params: UseTooltipPopupParameters): UseTooltipPopupReturnValue {
  const { getProps } = params;

  const getPopupProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(getProps(externalProps), {
        style: {
          // <Popover.Arrow> must be relative to the <Popover.Popup> element.
          position: 'relative',
        },
      });
    },
    [getProps],
  );

  return React.useMemo(
    () => ({
      getPopupProps,
    }),
    [getPopupProps],
  );
}
