import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';

export function usePopoverBackdrop(): usePopoverBackdrop.ReturnValue {
  const { mounted } = usePopoverRootContext();

  const getBackdropProps = React.useCallback(
    (externalProps = {}) => {
      const hidden = !mounted;
      return mergeReactProps<'div'>(externalProps, {
        role: 'presentation',
        hidden,
        style: {
          overflow: 'auto',
          position: 'fixed',
          inset: 0,
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

namespace usePopoverBackdrop {
  export interface ReturnValue {
    getBackdropProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  }
}
