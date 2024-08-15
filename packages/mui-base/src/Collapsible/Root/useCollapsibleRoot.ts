'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { useId } from '../../utils/useId';
import {
  UseCollapsibleRootParameters,
  UseCollapsibleRootReturnValue,
} from './CollapsibleRoot.types';
/**
 *
 * Demos:
 *
 * - [Collapsible](https://mui.com/base-ui/react-collapsible/#hooks)
 *
 * API:
 *
 * - [useCollapsibleRoot API](https://mui.com/base-ui/react-collapsible/hooks-api/#use-collapsible-root)
 */
function useCollapsibleRoot(
  parameters: UseCollapsibleRootParameters,
): UseCollapsibleRootReturnValue {
  const {
    animated = true,
    open: openParam,
    defaultOpen = true,
    onOpenChange,
    disabled = false,
  } = parameters;

  const [open, setOpenState] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Collapsible',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, animated);

  const [contentId, setContentId] = React.useState<string | undefined>(useId());

  const setOpen = useEventCallback((nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    setOpenState(nextOpen);
  });

  return React.useMemo(
    () => ({
      animated,
      contentId,
      disabled,
      mounted,
      open,
      setContentId,
      setMounted,
      setOpen,
      transitionStatus,
    }),
    [
      animated,
      contentId,
      disabled,
      mounted,
      open,
      setContentId,
      setMounted,
      setOpen,
      transitionStatus,
    ],
  );
}

export { useCollapsibleRoot };
