'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTransitionStatus, TransitionStatus } from '../../utils/useTransitionStatus';
import { useBaseUiId } from '../../utils/useBaseUiId';

export function useCollapsibleRoot(
  parameters: useCollapsibleRoot.Parameters,
): useCollapsibleRoot.ReturnValue {
  const { open: openParam, defaultOpen, onOpenChange, disabled } = parameters;

  const [open, setOpenState] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Collapsible',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, true);

  const [panelId, setPanelId] = React.useState<string | undefined>(useBaseUiId());

  const setOpen = useEventCallback((nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    setOpenState(nextOpen);
  });

  return React.useMemo(
    () => ({
      panelId,
      disabled,
      mounted,
      open,
      setPanelId,
      setMounted,
      setOpen,
      transitionStatus,
    }),
    [panelId, disabled, mounted, open, setPanelId, setMounted, setOpen, transitionStatus],
  );
}

export namespace useCollapsibleRoot {
  export interface Parameters {
    /**
     * If `true`, the Collapsible is initially open.
     * This is the controlled counterpart of `defaultOpen`.
     */
    open?: boolean;
    /**
     * If `true`, the Collapsible is initially open.
     * This is the uncontrolled counterpart of `open`.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Callback fired when the Collapsible is opened or closed.
     */
    onOpenChange: (open: boolean) => void;
    /**
     * If `true`, the component is disabled.
     */
    disabled: boolean;
  }

  export interface ReturnValue {
    panelId: React.HTMLAttributes<Element>['id'];
    /**
     * The disabled state of the Collapsible
     */
    disabled: boolean;
    mounted: boolean;
    /**
     * The open state of the Collapsible
     */
    open: boolean;
    setPanelId: (id: string | undefined) => void;
    setMounted: (open: boolean) => void;
    setOpen: (open: boolean) => void;
    transitionStatus: TransitionStatus;
  }
}
