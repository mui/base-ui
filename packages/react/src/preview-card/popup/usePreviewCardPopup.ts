import * as React from 'react';
import { mergeProps } from '../../merge-props';
import type { HTMLProps } from '../../utils/types';

export function usePreviewCardPopup(
  params: usePreviewCardPopup.Parameters,
): usePreviewCardPopup.ReturnValue {
  const { getProps } = params;

  const getPopupProps = React.useCallback(
    (externalProps = {}) => {
      return mergeProps<'div'>(
        {
          style: {
            // <Popover.Arrow> must be relative to the <Popover.Popup> element.
            position: 'relative',
          },
        },
        getProps(externalProps),
      );
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

export namespace usePreviewCardPopup {
  export interface Parameters {
    getProps: (externalProps?: HTMLProps) => HTMLProps;
  }

  export interface ReturnValue {
    getPopupProps: (externalProps?: HTMLProps) => HTMLProps;
  }
}
