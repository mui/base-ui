'use client';
import * as React from 'react';
import { fastComponent } from '@base-ui/utils/fastHooks';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useDismiss, FloatingTree } from '../../floating-ui-react';
import { PreviewCardRootContext, usePreviewCardRootContext } from './PreviewCardContext';
import {
  createChangeEventDetails,
  type BaseUIChangeEventDetails,
} from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { PreviewCardStore } from '../store/PreviewCardStore';
import {
  FOCUSABLE_POPUP_PROPS,
  PayloadChildRenderFunction,
  useImplicitActiveTrigger,
  usePopupRootStore,
  useOpenStateTransitions,
  usePopupInteractionProps,
} from '../../utils/popups';
import { PreviewCardHandle } from '../store/PreviewCardHandle';
import { mergeProps } from '../../merge-props';

function PreviewCardRootComponent<Payload>(props: PreviewCardRoot.Props<Payload>) {
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

  const store = usePopupRootStore(
    handle,
    (floatingId, nested) =>
      new PreviewCardStore<Payload>(
        {
          open: defaultOpen,
          openProp,
          activeTriggerId: defaultTriggerIdProp,
          triggerIdProp,
        },
        floatingId,
        nested,
      ),
  );

  store.useControlledProp('openProp', openProp);
  store.useControlledProp('triggerIdProp', triggerIdProp);

  store.useContextCallback('onOpenChange', onOpenChange);
  store.useContextCallback('onOpenChangeComplete', onOpenChangeComplete);

  const open = store.useState('open');
  const activeTriggerId = store.useState('activeTriggerId');
  const mounted = store.useState('mounted');
  const payload = store.useState('payload') as Payload | undefined;

  useImplicitActiveTrigger(store, { closeOnActiveTriggerUnmount: true });
  const { forceUnmount } = useOpenStateTransitions(open, store, () => {
    store.context.inlineRectCoordsRef.current = undefined;
  });

  useIsoLayoutEffect(() => {
    if (open) {
      if (activeTriggerId == null) {
        store.set('payload', undefined);
      }
    }
  }, [store, activeTriggerId, open]);

  React.useImperativeHandle(
    actionsRef,
    () => ({
      unmount: forceUnmount,
      close: () => store.setOpen(false, createChangeEventDetails(REASONS.imperativeAction)),
    }),
    [forceUnmount, store],
  );

  const shouldRenderInteractions = open || mounted;

  return (
    <PreviewCardRootContext.Provider value={store as PreviewCardRootContext}>
      {shouldRenderInteractions && <PreviewCardInteractions store={store} />}
      {typeof children === 'function' ? children({ payload }) : children}
    </PreviewCardRootContext.Provider>
  );
}

function PreviewCardInteractions<Payload>({ store }: { store: PreviewCardStore<Payload> }) {
  const floatingRootContext = store.useState('floatingRootContext');

  const dismiss = useDismiss(floatingRootContext);
  const popupProps = React.useMemo(
    () => mergeProps(FOCUSABLE_POPUP_PROPS, dismiss.floating),
    [dismiss.floating],
  );

  usePopupInteractionProps(store, {
    // `enabled` is not passed to `useDismiss`, so its props are always defined,
    // and `trigger` is the same object as `reference`.
    activeTriggerProps: dismiss.reference!,
    inactiveTriggerProps: dismiss.trigger!,
    popupProps,
  });

  return null;
}

/**
 * Groups all parts of the preview card.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardRoot = fastComponent(function PreviewCardRoot<Payload>(
  props: PreviewCardRoot.Props<Payload>,
) {
  if (usePreviewCardRootContext(true)) {
    return <PreviewCardRootComponent {...props} />;
  }

  return (
    <FloatingTree>
      <PreviewCardRootComponent {...props} />
    </FloatingTree>
  );
});

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
   * This is useful in conjunction with the `open` prop to create a controlled preview card.
   * There's no need to specify this prop when the preview card is uncontrolled (that is, when the `open` prop is not set).
   */
  triggerId?: string | null | undefined;
  /**
   * ID of the trigger that the preview card is associated with.
   * This is useful in conjunction with the `defaultOpen` prop to create an initially open preview card.
   */
  defaultTriggerId?: string | null | undefined;
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
