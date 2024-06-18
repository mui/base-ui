import * as React from 'react';
import type {
  UsePopoverTriggerParameters,
  UsePopoverTriggerReturnValue,
} from './usePopoverTrigger.types';

/**
 *
 * API:
 *
 * - [usePopoverTrigger API](https://mui.com/base-ui/api/use-popover-trigger/)
 */
export function usePopoverTrigger(
  params: UsePopoverTriggerParameters,
): UsePopoverTriggerReturnValue {
  const { getProps } = params;

  const getTriggerProps = React.useCallback(
    (externalProps = {}) => {
      return getProps(externalProps);
    },
    [getProps],
  );

  return React.useMemo(
    () => ({
      getTriggerProps,
    }),
    [getTriggerProps],
  );
}
