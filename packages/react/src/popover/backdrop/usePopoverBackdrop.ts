import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';
import { usePopoverRootContext } from '../root/PopoverRootContext';

export function usePopoverBackdrop(): usePopoverBackdrop.ReturnValue {
  const { mounted } = usePopoverRootContext();

  const getBackdropProps = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(externalProps, {
        role: 'presentation',
        hidden: !mounted,
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
