'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
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
  const { open: openParam, defaultOpen = true, onOpenChange, disabled = false } = parameters;

  const [open, setOpen] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'CollapsibleRoot',
  });

  const [contentId, setContentId] = React.useState<string | undefined>(useId());

  React.useEffect(() => {
    if (onOpenChange) {
      onOpenChange(open);
    }
  }, [onOpenChange, open]);

  return {
    contentId,
    disabled,
    open,
    setContentId,
    setOpen,
  };
}

export { useCollapsibleRoot };
