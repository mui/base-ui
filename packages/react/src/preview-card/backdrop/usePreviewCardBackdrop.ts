import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';

export function usePreviewCardBackdrop(): usePreviewCardBackdrop.ReturnValue {
  const { mounted } = usePreviewCardRootContext();

  const getBackdropProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(externalProps, {
        hidden: !mounted,
        style: {
          overflow: 'auto',
          position: 'fixed',
          inset: 0,
          pointerEvents: 'none',
        },
      });
    },
    [mounted],
  );

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
