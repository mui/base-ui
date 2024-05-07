import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import type { OpenChangeReason } from '@floating-ui/react';
import type { UseTooltipRootParameters, UseTooltipRootReturnValue } from './useTooltipRoot.types';
import { useControlled } from '../../utils/useControlled';
import { useTransitionStatus } from '../../useTransitionStatus';

/**
 * Manages the root state for a tooltip.
 *
 * API:
 *
 * - [useTooltipRoot API](https://mui.com/base-ui/api/use-tooltip-root/)
 */
export function useTooltipRoot(params: UseTooltipRootParameters): UseTooltipRootReturnValue {
  const {
    open: externalOpen,
    onOpenChange: unstableOnOpenChange = () => {},
    defaultOpen = false,
  } = params;

  const [open, setOpenUnwrapped] = useControlled({
    controlled: externalOpen,
    default: defaultOpen,
    name: 'Tooltip',
    state: 'open',
  });

  const onOpenChange = useEventCallback(unstableOnOpenChange);

  const setOpen = React.useCallback(
    (nextOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
      onOpenChange(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
    [onOpenChange, setOpenUnwrapped],
  );

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  return React.useMemo(
    () => ({
      open,
      setOpen,
      mounted,
      setMounted,
      transitionStatus,
    }),
    [mounted, open, setMounted, setOpen, transitionStatus],
  );
}
