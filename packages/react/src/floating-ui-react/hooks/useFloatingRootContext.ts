import { isElement } from '@floating-ui/utils/dom';
import { useId } from '@base-ui-components/utils/useId';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import type { ReferenceType } from '../types';
import type { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { useFloatingParentNodeId } from '../components/FloatingTree';

import { FloatingRootContextStore } from '../components/FloatingRootContextStore';

export interface UseFloatingRootContextOptions {
  open?: boolean;
  onOpenChange?(open: boolean, eventDetails: BaseUIChangeEventDetails<string>): void;
  elements: {
    reference: Element | null;
    floating: HTMLElement | null;
    triggers?: Element[];
  };
  /**
   * Whether to prevent the auto-emitted `openchange` event.
   */
  noEmit?: boolean;
}

export function useFloatingRootContext(
  options: UseFloatingRootContextOptions,
): FloatingRootContextStore {
  const { open = false, onOpenChange, elements } = options;

  const floatingId = useId();
  const nested = useFloatingParentNodeId() != null;

  if (process.env.NODE_ENV !== 'production') {
    const optionDomReference = elements.reference;
    if (optionDomReference && !isElement(optionDomReference)) {
      console.error(
        'Cannot pass a virtual element to the `elements.reference` option,',
        'as it must be a real DOM element. Use `refs.setPositionReference()`',
        'instead.',
      );
    }
  }

  const store = useRefWithInit(
    () =>
      new FloatingRootContextStore<ReferenceType>({
        open,
        onOpenChange,
        referenceElement: elements.reference,
        floatingElement: elements.floating,
        triggerElements: elements.triggers,
        floatingId,
        nested,
        noEmit: options.noEmit || false,
      }),
  ).current;

  store.useSyncedValues({
    open,
    referenceElement: elements.reference,
    domReferenceElement: isElement(elements.reference) ? elements.reference : null,
    floatingElement: elements.floating,
    triggerElements: elements.triggers,
    floatingId,
  });

  store.context.onOpenChange = onOpenChange;
  store.context.nested = nested;
  store.context.noEmit = options.noEmit || false;

  return store;
}
