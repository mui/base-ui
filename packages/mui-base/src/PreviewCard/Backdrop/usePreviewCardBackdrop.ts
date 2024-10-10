import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';
import { MAX_Z_INDEX } from '../../utils/floating';

export function usePreviewCardBackdrop(): usePreviewCardBackdrop.ReturnValue {
  const getBackdropProps = React.useCallback((externalProps = {}) => {
    return mergeReactProps<'div'>(externalProps, {
      style: {
        zIndex: MAX_Z_INDEX, // max z-index
        overflow: 'auto',
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
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

namespace usePreviewCardBackdrop {
  export interface ReturnValue {
    getBackdropProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
