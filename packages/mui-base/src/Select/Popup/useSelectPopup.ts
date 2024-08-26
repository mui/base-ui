import * as React from 'react';
import type { GenericHTMLProps } from '../../utils/types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSelectRootContext } from '../Root/SelectRootContext';

/**
 *
 * API:
 *
 * - [useSelectPopup API](https://mui.com/base-ui/api/use-select-popup/)
 */
export function useSelectPopup(): useSelectPopup.ReturnValue {
  const {
    getPopupProps: getRootPopupProps,
    alignToItem,
    selectedIndex,
    innerFallback,
  } = useSelectRootContext();

  const hasSelectedIndex = selectedIndex !== null;

  const getPopupProps: useSelectPopup.ReturnValue['getPopupProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(getRootPopupProps(externalProps), {
        style: {
          // <Select.Arrow> must be relative to the <Select.Popup> element.
          position: 'relative',
          overflowY: 'auto',
          ...(alignToItem &&
            hasSelectedIndex &&
            !innerFallback && {
              scrollbarWidth: 'none',
            }),
        },
      });
    },
    [getRootPopupProps, alignToItem, hasSelectedIndex, innerFallback],
  );

  return React.useMemo(
    () => ({
      getPopupProps,
    }),
    [getPopupProps],
  );
}

namespace useSelectPopup {
  export interface ReturnValue {
    getPopupProps: (props?: GenericHTMLProps) => GenericHTMLProps;
  }
}
