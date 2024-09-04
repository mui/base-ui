'use client';

import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UsePreviewCardPopupParameters,
  UsePreviewCardPopupReturnValue,
} from './usePreviewCardPopup.types';

/**
 *
 * API:
 *
 * - [usePreviewCardPopup API](https://mui.com/base-ui/api/use-preview-card-popup/)
 */
export function usePreviewCardPopup(
  params: UsePreviewCardPopupParameters,
): UsePreviewCardPopupReturnValue {
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
