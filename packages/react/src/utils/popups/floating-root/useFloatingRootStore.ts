'use client';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { PopupTriggerMap } from '../popupTriggerMap';
import type { BaseUIChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { useFloatingParentNodeId } from '../tree/FloatingTree';
import { FloatingRootStore } from './FloatingRootStore';
import type { FloatingRootState as State } from './FloatingRootStore';

/**
 * What `useFloatingRootStore` syncs into its store.
 */
export interface UseFloatingRootStoreOptions {
  /**
   * Whether the popup is open. Positioning clears the anchor while the popup isn't mounted, and
   * syncs it in again only when `open` or `elements.anchor` changes, so `open` must follow
   * `mounted`.
   * @default false
   */
  open?: boolean | undefined;
  /**
   * Called when an interaction hook requests an open change.
   */
  onOpenChange?(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  /**
   * The elements to sync into the store. A key left `undefined` keeps the store's current value.
   */
  elements?:
    | {
        /**
         * The DOM element the popup is anchored to. To position against a virtual element, pass it
         * as `useAnchorPositioning`'s `anchor` instead.
         */
        anchor?: Element | null | undefined;
        /**
         * The popup's positioner element, or the popup itself when it has no positioner.
         */
        positionerElement?: HTMLElement | null | undefined;
      }
    | undefined;
}

/**
 * Creates a `FloatingRootStore` for components that manage their open state without a popup
 * store. The open state, anchor and positioner element are synced into it from a layout effect
 * whenever they change; `onOpenChange` and the nesting flag are updated during render.
 */
export function useFloatingRootStore(options: UseFloatingRootStoreOptions): FloatingRootStore {
  const { open = false, onOpenChange, elements = {} } = options;

  const defaultPopupId = useId();
  const nested = useFloatingParentNodeId() != null;

  const store = useRefWithInit(
    () =>
      new FloatingRootStore({
        open,
        onOpenChange,
        anchorElement: elements.anchor ?? null,
        positionerElement: elements.positionerElement ?? null,
        triggerElements: new PopupTriggerMap(),
        defaultPopupId,
        nested,
      }),
  ).current;

  useIsoLayoutEffect(() => {
    const valuesToSync = { open, defaultPopupId } as Pick<
      State,
      'open' | 'defaultPopupId' | 'anchorElement' | 'positionerElement'
    >;

    if (elements.anchor !== undefined) {
      valuesToSync.anchorElement = elements.anchor;
    }

    if (elements.positionerElement !== undefined) {
      valuesToSync.positionerElement = elements.positionerElement;
    }

    store.update(valuesToSync);
  }, [open, defaultPopupId, elements.anchor, elements.positionerElement, store]);

  store.context.onOpenChange = onOpenChange;
  store.context.nested = nested;

  return store;
}
