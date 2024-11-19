import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';

export function usePopoverPopup(params: usePopoverPopup.Parameters): usePopoverPopup.ReturnValue {
  const { getProps, titleId, descriptionId } = params;

  const getPopupProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(getProps(externalProps), {
        'aria-labelledby': titleId,
        'aria-describedby': descriptionId,
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

namespace usePopoverPopup {
  export interface Parameters {
    getProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    titleId: string | undefined;
    descriptionId: string | undefined;
  }

  export interface ReturnValue {
    getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
