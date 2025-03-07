import * as React from 'react';
import { mergeProps } from '../../merge-props';
import { useEventCallback } from '../../utils/useEventCallback';

export function usePopoverClose(
  params: usePopoverDescription.Parameters,
): usePopoverDescription.ReturnValue {
  const { onClose: onCloseProp } = params;

  const onClose = useEventCallback(onCloseProp);

  const getCloseProps = React.useCallback(
    (externalProps = {}) => {
      return mergeProps<'button'>(
        {
          onClick: onClose,
        },
        externalProps,
      );
    },
    [onClose],
  );

  return React.useMemo(
    () => ({
      getCloseProps,
    }),
    [getCloseProps],
  );
}

namespace usePopoverDescription {
  export interface Parameters {
    onClose: () => void;
  }
  export interface ReturnValue {
    getCloseProps: (
      externalProps?: React.ComponentPropsWithoutRef<'button'>,
    ) => React.ComponentPropsWithoutRef<'button'>;
  }
}
