'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { useButton } from '../../internals/use-button';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { useTransitionStatus } from '../../internals/useTransitionStatus';
import type { CollapsibleRoot, CollapsibleRootState } from './CollapsibleRoot';
import { useCollapsibleRootContext } from './CollapsibleRootContext';

export function useFallbackId() {
  const defaultId = useBaseUiId();
  // `undefined` uses the initial generated fallback; `null` means the element unmounted.
  const [registeredId, setRegisteredId] = React.useState<string | null | undefined>();
  const id = registeredId === null ? undefined : (registeredId ?? defaultId);
  return [defaultId, id, setRegisteredId] as const;
}

export function useRegisterFallbackId(
  idProp: string | undefined,
  defaultId: string | undefined,
  setRegisteredId: React.Dispatch<React.SetStateAction<string | null | undefined>>,
) {
  const registeredId = idProp || undefined;
  useIsoLayoutEffect(() => {
    setRegisteredId((currentId) => registeredId ?? (currentId === null ? undefined : currentId));
    return () => {
      setRegisteredId((currentId) => (currentId === registeredId ? null : currentId));
    };
  }, [registeredId, setRegisteredId]);
  return idProp ?? defaultId;
}

export function useCollapsibleTrigger<State extends Record<string, any>>(
  componentProps: BaseUIComponentProps<'button', State> & NativeButtonProps,
  forwardedRef: React.ForwardedRef<any>,
  stateAttributesMapping: StateAttributesMapping<State>,
  itemState?: State,
  id?: string,
) {
  const {
    className,
    disabled: disabledProp,
    id: idProp,
    render,
    nativeButton = true,
    style,
    ...elementProps
  } = componentProps;

  const {
    panelId,
    open,
    handleTrigger,
    state: collapsibleState,
    disabled: contextDisabled,
  } = useCollapsibleRootContext();

  const disabled = disabledProp || contextDisabled;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    native: nativeButton,
  });

  return useRenderElement('button', componentProps, {
    state: { ...(itemState ?? (collapsibleState as unknown as State)), disabled },
    ref: [forwardedRef, buttonRef],
    props: [
      {
        'aria-controls': open ? panelId : undefined,
        'aria-expanded': open,
        id: id ?? idProp,
        onClick: handleTrigger,
      },
      elementProps,
      getButtonProps,
    ],
    stateAttributesMapping,
  });
}

export function useCollapsibleRoot(
  parameters: UseCollapsibleRootParameters,
): UseCollapsibleRootReturnValue {
  const { open: openParam, defaultOpen = false, onOpenChange, disabled } = parameters;

  const [open, setOpen] = useControlled({
    controlled: openParam,
    default: defaultOpen,
    name: 'Collapsible',
    state: 'open',
  });

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open, true, true);

  const [defaultPanelId, panelId, setPanelIdState] = useFallbackId();

  const handleTrigger = useStableCallback((event: React.MouseEvent | React.KeyboardEvent) => {
    const nextOpen = !open;
    const eventDetails = createChangeEventDetails(REASONS.triggerPress, event.nativeEvent);

    onOpenChange(nextOpen, eventDetails);

    if (eventDetails.isCanceled) {
      return;
    }

    setOpen(nextOpen);
  });

  const state: CollapsibleRootState = React.useMemo(
    () => ({
      open,
      disabled,
      transitionStatus,
    }),
    [open, disabled, transitionStatus],
  );

  return React.useMemo(
    () => ({
      defaultPanelId,
      disabled,
      handleTrigger,
      mounted,
      onOpenChange,
      open,
      panelId,
      setMounted,
      setOpen,
      setPanelIdState,
      state,
      transitionStatus,
    }),
    [
      defaultPanelId,
      disabled,
      handleTrigger,
      mounted,
      onOpenChange,
      open,
      panelId,
      setMounted,
      setOpen,
      setPanelIdState,
      state,
      transitionStatus,
    ],
  );
}

export interface UseCollapsibleRootParameters {
  /**
   * Whether the collapsible panel is currently open.
   *
   * To render an uncontrolled collapsible, use the `defaultOpen` prop instead.
   */
  open?: boolean | undefined;
  /**
   * Whether the collapsible panel is initially open.
   *
   * To render a controlled collapsible, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Event handler called when the panel is opened or closed.
   */
  onOpenChange: (open: boolean, eventDetails: CollapsibleRoot.ChangeEventDetails) => void;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: boolean;
}

export interface UseCollapsibleRootReturnValue {
  defaultPanelId: React.HTMLAttributes<Element>['id'];
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  handleTrigger: (event: React.MouseEvent | React.KeyboardEvent) => void;
  /**
   * Whether the collapsible panel is mounted for transition and hidden-state
   * purposes. This can be `false` while the element remains in the DOM when
   * `keepMounted` or `hiddenUntilFound` is enabled.
   */
  mounted: boolean;
  onOpenChange: (open: boolean, eventDetails: CollapsibleRoot.ChangeEventDetails) => void;
  /**
   * Whether the collapsible panel is currently open.
   */
  open: boolean;
  panelId: React.HTMLAttributes<Element>['id'];
  setMounted: (nextMounted: boolean) => void;
  setOpen: (open: boolean) => void;
  setPanelIdState: React.Dispatch<React.SetStateAction<string | null | undefined>>;
  state: CollapsibleRootState;
  transitionStatus: TransitionStatus;
}

export interface UseCollapsibleRootState {}
