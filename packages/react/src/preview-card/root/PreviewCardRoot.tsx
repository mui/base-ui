'use client';
import * as React from 'react';
import { fastComponent } from '@base-ui/utils/fastHooks';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useDismiss } from '../../utils/popups/interactions/useDismiss';
import { FloatingTree, useFloatingNodeId } from '../../utils/popups/tree/FloatingTree';
import {
  PreviewCardRootContext,
  PreviewCardTreeNodeIdContext,
  usePreviewCardRootContext,
} from './PreviewCardContext';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import { PreviewCardStore } from '../store/PreviewCardStore';
import type { PayloadChildRenderFunction } from '../../utils/popups';
import {
  renderPopupRootChildren,
  usePopupRoot,
  usePopupInteractionProps,
} from '../../utils/popups';
import type { PreviewCardHandle } from '../store/PreviewCardHandle';

function PreviewCardRootComponent<Payload>(props: PreviewCardRoot.Props<Payload>) {
  const { handle, children } = props;

  const { store, open, mounted, payload } = usePopupRoot(
    props,
    (initialState, floatingId, nested) =>
      new PreviewCardStore<Payload>(initialState, floatingId, nested),
    { closeOnActiveTriggerUnmount: true },
  );

  const activeTriggerId = store.useState('activeTriggerId');

  useIsoLayoutEffect(() => {
    if (open) {
      if (activeTriggerId == null) {
        store.set('payload', undefined);
      }
    }
  }, [store, activeTriggerId, open]);

  // Detached triggers share this one Root, so mounting its interactions eagerly is cheap. The
  // trigger props they publish then stay stable, so opening and closing doesn't re-render inactive
  // triggers.
  const shouldRenderInteractions = open || mounted || handle != null;

  const treeNodeId = useFloatingNodeId();

  return (
    <PreviewCardRootContext.Provider value={store as PreviewCardRootContext}>
      <PreviewCardTreeNodeIdContext.Provider value={treeNodeId}>
        {renderPopupRootChildren({
          store,
          handle,
          interactions: shouldRenderInteractions && <PreviewCardInteractions store={store} />,
          children,
          payload,
        })}
      </PreviewCardTreeNodeIdContext.Provider>
    </PreviewCardRootContext.Provider>
  );
}

function PreviewCardInteractions<Payload>({ store }: { store: PreviewCardStore<Payload> }) {
  const dismiss = useDismiss(store);

  // `useDismiss` is not given an `enabled` option, so all three prop bags are always defined.
  // `dismiss.trigger` is the same object as `dismiss.reference`.
  usePopupInteractionProps(store, {
    activeTriggerProps: dismiss.reference!,
    inactiveTriggerProps: dismiss.trigger!,
    popupProps: dismiss.floating!,
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
    ((open: boolean, eventDetails: PreviewCardRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Event handler called after any animations complete when the preview card is opened or closed.
   */
  onOpenChangeComplete?: ((open: boolean) => void) | undefined;
  /**
   * A ref to imperative actions.
   * - `unmount`: Ends the closing phase of the preview card after an externally controlled closing animation finishes.
   * Call `preventUnmountOnClose()` in `onOpenChange` first, otherwise the preview card completes closing on its own.
   * Whether it leaves the DOM is decided by `keepMounted` on the portal.
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
    /** Prevents the popup from unmounting until the `unmount` action is called. */
    preventUnmountOnClose: () => void;
  };

export namespace PreviewCardRoot {
  export type State = PreviewCardRootState;
  export type Props<Payload = unknown> = PreviewCardRootProps<Payload>;
  export type Actions = PreviewCardRootActions;
  export type ChangeEventReason = PreviewCardRootChangeEventReason;
  export type ChangeEventDetails = PreviewCardRootChangeEventDetails;
}
