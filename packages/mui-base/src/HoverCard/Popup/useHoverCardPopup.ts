'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UseHoverCardPopupParameters,
  UseHoverCardPopupReturnValue,
} from './useHoverCardPopup.types';

/**
 *
 * API:
 *
 * - [useHoverCardPopup API](https://mui.com/base-ui/api/use-hover-card-popup/)
 */
export function useHoverCardPopup(
  params: UseHoverCardPopupParameters,
): UseHoverCardPopupReturnValue {
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
