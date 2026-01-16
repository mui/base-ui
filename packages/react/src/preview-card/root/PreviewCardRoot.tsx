'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useOnFirstRender } from '@base-ui/utils/useOnFirstRender';
import { useDismiss, useInteractions } from '../../floating-ui-react';
import { PreviewCardRootContext } from './PreviewCardContext';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { PreviewCardStore } from '../store/PreviewCardStore';
import {
  PayloadChildRenderFunction,
  useImplicitActiveTrigger,
  useOpenStateTransitions,
} from '../../utils/popups';
import { PreviewCardHandle } from '../store/PreviewCardHandle';

/**
 * Groups all parts of the preview card.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export function PreviewCardRoot<Payload>(props: PreviewCardRoot.Props<Payload>) {
  const {
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    onOpenChangeComplete,
    actionsRef,
    handle,
    triggerId: triggerIdProp,
    defaultTriggerId: defaultTriggerIdProp = null,
    children,
  } = props;

  const store = PreviewCardStore.useStore<Payload>(handle?.store, {
    open: defaultOpen,
    openProp,
    activeTriggerId: defaultTriggerIdProp,
    triggerIdProp,
  });

  // Support initially open state when uncontrolled
  useOnFirstRender(() => {
    if (openProp === undefined && store.state.open === false && defaultOpen === true) {
      store.update({
        open: true,
        activeTriggerId: defaultTriggerIdProp,
      });
    }
  });

  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);

  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const open = store.useState('open');

  const activeTriggerId = store.useState('activeTriggerId');
  const payload = store.useState('payload') as Payload | undefined;

  useImplicitActiveTrigger(store);
  const { forceUnmount } = useOpenStateTransitions(open, store);

  useIsoLayoutEffect(() => {
    if (open) {
      if (activeTriggerId == null) {
        store.set('payload', undefined);
      }
    }
  }, [store, activeTriggerId, open]);

  const handleImperativeClose = React.useCallback(() => {
    store.setOpen(false, createPreviewCardEventDetails(store, REASONS.imperativeAction));
  }, [store]);

  React.useImperativeHandle(
    actionsRef,
    () => ({ unmount: forceUnmount, close: handleImperativeClose }),
    [forceUnmount, handleImperativeClose],
  );

  const floatingRootContext = store.useState('floatingRootContext');

  const dismiss = useDismiss(floatingRootContext);

  const { getReferenceProps, getTriggerProps, getFloatingProps } = useInteractions([dismiss]);

  const activeTriggerProps = React.useMemo(() => getReferenceProps(), [getReferenceProps]);
  const inactiveTriggerProps = React.useMemo(() => getTriggerProps(), [getTriggerProps]);
  const popupProps = React.useMemo(() => getFloatingProps(), [getFloatingProps]);

  store.useSyncedValues({
    activeTriggerProps,
    inactiveTriggerProps,
    popupProps,
  });

  return (
    <PreviewCardRootContext.Provider value={store as PreviewCardRootContext}>
      {typeof children === 'function' ? children({ payload }) : children}
    </PreviewCardRootContext.Provider>
  );
}

function createPreviewCardEventDetails<Payload>(
  store: PreviewCardStore<Payload>,
  reason: PreviewCardRoot.ChangeEventReason,
) {
  const details: PreviewCardRoot.ChangeEventDetails =
    createChangeEventDetails<PreviewCardRoot.ChangeEventReason>(
      reason,
    ) as PreviewCardRoot.ChangeEventDetails;
  details.preventUnmountOnClose = () => {
    store.set('preventUnmountingOnClose', true);
  };
  return details;
}

export interface PreviewCardRootState {}

export interface PreviewCardRootProps<Payload = unknown> {
  /**
   * Whether the preview card is initially open.
   *
   * To render a controlled preview card, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean | undefined;
  /**
   * Whether the preview card is currently open.
   */
  open?: boolean | undefined;
  /**
   * Event handler called when the preview card is opened or closed.
   */
  onOpenChange?:
    | ((open: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) => void)
    | undefined;
  /**
   * Event handler called after any animations complete when the preview card is opened or closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Unmounts the preview card popup.
   * - `close`: Closes the preview card imperatively when called.
   */
  actionsRef?: React.RefObject<PreviewCardRoot.Actions | null> | undefined;
  /**
   * A handle to associate the preview card with a trigger.
   * If specified, allows external triggers to control the card's open state.
   * Can be created with the PreviewCard.createHandle() method.
   */
  handle?: PreviewCardHandle<Payload> | undefined;
  /**
   * The content of the preview card.
   * This can be a regular React node or a render function that receives the `payload` of the active trigger.
   */
  children?: React.ReactNode | PayloadChildRenderFunction<Payload>;
  /**
   * ID of the trigger that the preview card is associated with.
   * This is useful in conjuntion with the `open` prop to create a controlled preview card.
   * There's no need to specify this prop when the preview card is uncontrolled (i.e. when the `open` prop is not set).
   */
  triggerId?: (string | null) | undefined;
  /**
   * ID of the trigger that the preview card is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open preview card.
   */
  defaultTriggerId?: (string | null) | undefined;
}

export interface PreviewCardRootActions {
  unmount: () => void;
  close: () => void;
}

export type PreviewCardRootChangeEventReason =
  | typeof REASONS.triggerHover
  | typeof REASONS.triggerFocus
  | typeof REASONS.triggerPress
  | typeof REASONS.outsidePress
  | typeof REASONS.escapeKey
  | typeof REASONS.imperativeAction
  | typeof REASONS.none;

export type PreviewCardRootChangeEventDetails =
  BaseUIChangeEventDetails<PreviewCardRoot.ChangeEventReason> & {
    preventUnmountOnClose(): void;
  };

export namespace PreviewCardRoot {
  export type State = PreviewCardRootState;
  export type Props<Payload = unknown> = PreviewCardRootProps<Payload>;
  export type Actions = PreviewCardRootActions;
  export type ChangeEventReason = PreviewCardRootChangeEventReason;
  export type ChangeEventDetails = PreviewCardRootChangeEventDetails;
}
