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
import type { ReferenceType } from './types';

export interface UseFloatingRootContextOptions {
  open?: boolean | undefined;
  onOpenChange?(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  elements?:
    | {
        anchor?: ReferenceType | null | undefined;
        outerPopupElement?: HTMLElement | null | undefined;
      }
    | undefined;
}

export function useFloatingRootContext(options: UseFloatingRootContextOptions): FloatingRootStore {
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
        outerPopupElement: elements.outerPopupElement ?? null,
        triggerElements: new PopupTriggerMap(),
        defaultPopupId,
        nested,
      }),
  ).current;

  useIsoLayoutEffect(() => {
    const valuesToSync = { open, defaultPopupId } as Pick<
      State,
      'open' | 'defaultPopupId' | 'baseAnchor' | 'anchorElement' | 'outerPopupElement'
    >;

    if (elements.anchor !== undefined) {
      valuesToSync.baseAnchor = elements.anchor;
      valuesToSync.anchorElement = isElement(elements.anchor) ? elements.anchor : null;
    }

    if (elements.outerPopupElement !== undefined) {
      valuesToSync.outerPopupElement = elements.outerPopupElement;
    }

    store.update(valuesToSync);
  }, [open, defaultPopupId, elements.anchor, elements.outerPopupElement, store]);

  store.context.onOpenChange = onOpenChange;
  store.context.nested = nested;

  return store;
}
