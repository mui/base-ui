import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';

export function usePreviewCardPopup(
  params: usePreviewCardPopup.Parameters,
): usePreviewCardPopup.ReturnValue {
  const { getProps } = params;

  const getPopupProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(
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

namespace usePreviewCardPopup {
  export interface Parameters {
    getProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }

  export interface ReturnValue {
    getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
