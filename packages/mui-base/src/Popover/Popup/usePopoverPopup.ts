'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type {
  UsePopoverPopupParameters,
  UsePopoverPopupReturnValue,
} from './usePopoverPopup.types';

/**
 *
 * API:
 *
 * - [usePopoverPopup API](https://mui.com/base-ui/api/use-popover-popup/)
 */
export function usePopoverPopup(params: UsePopoverPopupParameters): UsePopoverPopupReturnValue {
  const { getProps, titleId, descriptionId } = params;

  const getPopupProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(getProps(externalProps), {
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
        style: {
          // <Popover.Arrow> must be relative to the <Popover.Popup> element.
          position: 'relative',
        },
      });
    },
    [getProps, titleId, descriptionId],
  );

  return React.useMemo(
    () => ({
      getPopupProps,
    }),
    [getPopupProps],
  );
}
