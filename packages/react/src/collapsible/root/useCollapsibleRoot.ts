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

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

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
     * Whether the collapsible panel is currently open.
     *
     * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
     */
    open?: boolean;
    /**
     * Whether the collapsible panel is initially open.
     *
     * To render a controlled collapsible, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the panel is opened or closed.
     */
    onOpenChange: (open: boolean) => void;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled: boolean;
  }

  export interface ReturnValue {
    panelId: React.HTMLAttributes<Element>['id'];
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    mounted: boolean;
    /**
     * Whether the collapsible panel is currently open.
     *
     * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
     */
    open: boolean;
    setPanelId: (id: string | undefined) => void;
    setMounted: (open: boolean) => void;
    setOpen: (open: boolean) => void;
    transitionStatus: TransitionStatus;
  }
}
