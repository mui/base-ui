'use client';
import { isElement } from '@floating-ui/utils/dom';
import { useId } from '@base-ui/utils/useId';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { PopupTriggerMap } from '../../utils/popups';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { useFloatingParentNodeId } from '../components/FloatingTree';
import { FloatingRootStore } from '../components/FloatingRootStore';
import type { ReferenceType } from '../types';

export interface UseFloatingRootContextOptions {
  open?: boolean | undefined;
  onOpenChange?(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  elements?:
    | {
        reference?: ReferenceType | null | undefined;
        floating?: HTMLElement | null | undefined;
      }
    | undefined;
}

export function useFloatingRootContext(options: UseFloatingRootContextOptions): FloatingRootStore {
  const { open = false, onOpenChange, elements = {} } = options;
  const reference = elements.reference;
  const floating = elements.floating;

  const floatingId = useId();
  const nested = useFloatingParentNodeId() != null;

  if (process.env.NODE_ENV !== 'production') {
    const optionDomReference = elements.reference;
    if (optionDomReference && !isElement(optionDomReference)) {
      console.error(
        'Cannot pass a virtual element to the `elements.reference` option,',
        'as it must be a real DOM element. Use `context.setPositionReference()`',
        'instead.',
      );
    }
  }

  const store = useRefWithInit(
    () =>
      new FloatingRootStore({
        open,
        transitionStatus: undefined,
        onOpenChange,
        referenceElement: reference ?? null,
        floatingElement: floating ?? null,
        triggerElements: new PopupTriggerMap(),
        floatingId,
        syncOnly: false,
        nested,
      }),
  ).current;

  useIsoLayoutEffect(() => {
    const referenceElement = reference === undefined ? store.state.referenceElement : reference;
    const floatingElement = floating === undefined ? store.state.floatingElement : floating;
    let domReferenceElement = store.state.domReferenceElement;

    if (reference !== undefined) {
      domReferenceElement = isElement(referenceElement) ? referenceElement : null;
    }

    store.update({
      open,
      floatingId,
      referenceElement,
      domReferenceElement,
      floatingElement,
    });
  }, [open, floatingId, reference, floating, store]);

  store.context.onOpenChange = onOpenChange;
  store.context.nested = nested;

  return store;
}
