import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useId } from '@base-ui-components/utils/useId';
import type { FloatingRootContext, ReferenceElement, ContextData } from '../types';
import type { BaseUIChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { createEventEmitter } from '../utils/createEventEmitter';
import { useFloatingParentNodeId } from '../components/FloatingTree';
import { FloatingUIOpenChangeDetails } from '../../utils/types';

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
): FloatingRootContext {
  const { open = false, onOpenChange: onOpenChangeProp, elements: elementsProp } = options;

  const floatingId = useId();
  const dataRef = React.useRef<ContextData>({});
  const [events] = React.useState(() => createEventEmitter());
  const nested = useFloatingParentNodeId() != null;

  if (process.env.NODE_ENV !== 'production') {
    const optionDomReference = elementsProp.reference;
    if (optionDomReference && !isElement(optionDomReference)) {
      console.error(
        'Cannot pass a virtual element to the `elements.reference` option,',
        'as it must be a real DOM element. Use `refs.setPositionReference()`',
        'instead.',
      );
    }
  }

  const [positionReference, setPositionReference] = React.useState<ReferenceElement | null>(
    elementsProp.reference,
  );

  const onOpenChange = useStableCallback(
    (newOpen: boolean, eventDetails: BaseUIChangeEventDetails<string>) => {
      dataRef.current.openEvent = newOpen ? eventDetails.event : undefined;
      if (!options.noEmit) {
        const details: FloatingUIOpenChangeDetails = {
          open: newOpen,
          reason: eventDetails.reason,
          nativeEvent: eventDetails.event,
          nested,
          triggerElement: eventDetails.trigger,
        };
        events.emit('openchange', details);
      }

      onOpenChangeProp?.(newOpen, eventDetails);
    },
  );

  const refs = React.useMemo(
    () => ({
      setPositionReference,
    }),
    [],
  );

  const elements = React.useMemo(
    () => ({
      reference: positionReference || elementsProp.reference || null,
      floating: elementsProp.floating || null,
      domReference: elementsProp.reference as Element | null,
      triggers: elementsProp.triggers ?? [],
    }),
    [positionReference, elementsProp.reference, elementsProp.floating, elementsProp.triggers],
  );

  return React.useMemo<FloatingRootContext>(
    () => ({
      dataRef,
      open,
      onOpenChange,
      elements,
      events,
      floatingId,
      refs,
    }),
    [open, onOpenChange, elements, events, floatingId, refs],
  );
}
