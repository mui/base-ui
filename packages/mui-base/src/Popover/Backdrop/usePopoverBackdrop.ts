import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';
import { MAX_Z_INDEX } from '../../utils/floating';

export function usePopoverBackdrop(): usePopoverBackdrop.ReturnValue {
  const getBackdropProps = React.useCallback((externalProps = {}) => {
    return mergeReactProps<'div'>(externalProps, {
      role: 'presentation',
      style: {
        zIndex: MAX_Z_INDEX, // max z-index
        overflow: 'auto',
        position: 'fixed',
        inset: 0,
      },
    });
  }, []);

  return React.useMemo(
    () => ({
      getBackdropProps,
    }),
    [getBackdropProps],
  );
}

namespace usePopoverBackdrop {
  export interface ReturnValue {
    getBackdropProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
