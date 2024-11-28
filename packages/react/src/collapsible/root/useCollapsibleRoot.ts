'use client';
import * as React from 'react';
import { useControlled } from '../../utils/useControlled';
import { useEventCallback } from '../../utils/useEventCallback';
import { useTransitionStatus, TransitionStatus } from '../../utils/useTransitionStatus';
import { useId } from '../../utils/useId';

export function useCollapsibleRoot(
  parameters: useCollapsibleRoot.Parameters,
): useCollapsibleRoot.ReturnValue {
  const { animated, open: openParam, defaultOpen, onOpenChange, disabled } = parameters;

  const [open, setOpenState] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Collapsible',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, animated, true);

  const [panelId, setPanelId] = React.useState<string | undefined>(useId());

  const setOpen = useEventCallback((nextOpen: boolean) => {
    onOpenChange?.(nextOpen);
    setOpenState(nextOpen);
  });

  return React.useMemo(
    () => ({
      animated,
      panelId,
      disabled,
      mounted,
      open,
      setPanelId,
      setMounted,
      setOpen,
      transitionStatus,
    }),
    [animated, panelId, disabled, mounted, open, setPanelId, setMounted, setOpen, transitionStatus],
  );
}

export namespace useCollapsibleRoot {
  export interface Parameters {
    /**
     * If `true`, the component supports CSS/JS-based animations and transitions.
     * @default true
     */
    animated: boolean;
    /**
     * If `true`, the Collapsible is initially open.
     * This is the controlled counterpart of `defaultOpen`.
     */
    open?: boolean;
    /**
     * If `true`, the Collapsible is initially open.
     * This is the uncontrolled counterpart of `open`.
     * @default true
     */
    defaultOpen?: boolean;
    /**
     * Callback fired when the Collapsible is opened or closed.
     * @default undefined
     */
    onOpenChange: (open: boolean) => void;
    /**
     * If `true`, the component is disabled.
     * @default false
     */
    disabled: boolean;
  }

  export interface ReturnValue {
    animated: boolean;
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
