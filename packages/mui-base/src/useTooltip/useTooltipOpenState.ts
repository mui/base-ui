import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import type { OpenChangeReason } from '@floating-ui/react';
import type {
  UseTooltipOpenStateParameters,
  UseTooltipOpenStateReturnValue,
} from './useTooltip.types';
import { useControlled } from '../utils/useControlled';

/**
 * Manages the open state for a tooltip.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/#hooks)
 *
 * API:
 *
 * - [useTooltipOpenState API](https://mui.com/base-ui/react-tooltip/hooks-api/#use-tooltip-open-state)
 */
export function useTooltipOpenState(
  params: UseTooltipOpenStateParameters,
): UseTooltipOpenStateReturnValue {
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

  return React.useMemo(
    () => ({
      open,
      setOpen,
    }),
    [open, setOpen],
  );
}
