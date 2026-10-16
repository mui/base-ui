'use client';
import { isElement } from '@floating-ui/utils/dom';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { PopupTriggerMap } from '../popupTriggerMap';
import type { BaseUIChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { useFloatingParentNodeId } from '../tree/FloatingTree';
import { FloatingRootStore } from './FloatingRootStore';
import type { FloatingRootState as State } from './FloatingRootStore';
import type { ReferenceType } from '../types';

/**
 * What `useFloatingRootStore` syncs into its store on every render.
 */
export interface UseFloatingRootStoreOptions {
  /**
   * Whether the popup is open.
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
         * The DOM element the popup is anchored to. Virtual elements go in `anchorOverride`.
         */
        anchor?: ReferenceType | null | undefined;
        /**
         * The popup's positioner element, or the popup itself when it has no positioner.
         */
        popupPositionerElement?: HTMLElement | null | undefined;
      }
    | undefined;
}

/**
 * Creates a `FloatingRootStore` and syncs the open state, anchor and positioner element into it on
 * every render, for components that manage their open state without a popup store.
 */
export function useFloatingRootStore(options: UseFloatingRootStoreOptions): FloatingRootStore {
  const { open = false, onOpenChange, elements = {} } = options;

  const defaultPopupId = useId();
  const nested = useFloatingParentNodeId() != null;

  if (process.env.NODE_ENV !== 'production') {
    const optionAnchor = elements.anchor;
    if (optionAnchor && !isElement(optionAnchor)) {
      console.error(
        'Cannot pass a virtual element to the `elements.anchor` option,',
        'as it must be a real DOM element. Set the `anchorOverride` instead.',
      );
    }
  }

  const store = useRefWithInit(
    () =>
      new FloatingRootStore({
        open,
        transitionStatus: undefined,
        onOpenChange,
        baseAnchor: elements.anchor ?? null,
        popupPositionerElement: elements.popupPositionerElement ?? null,
        triggerElements: new PopupTriggerMap(),
        defaultPopupId,
        nested,
      }),
  ).current;

  useIsoLayoutEffect(() => {
    const valuesToSync = { open, defaultPopupId } as Pick<
      State,
      'open' | 'defaultPopupId' | 'baseAnchor' | 'anchorElement' | 'popupPositionerElement'
    >;

    if (elements.anchor !== undefined) {
      valuesToSync.baseAnchor = elements.anchor;
      valuesToSync.anchorElement = isElement(elements.anchor) ? elements.anchor : null;
    }

    if (elements.popupPositionerElement !== undefined) {
      valuesToSync.popupPositionerElement = elements.popupPositionerElement;
    }

    store.update(valuesToSync);
  }, [open, defaultPopupId, elements.anchor, elements.popupPositionerElement, store]);

  store.context.onOpenChange = onOpenChange;
  store.context.nested = nested;

  return store;
}
