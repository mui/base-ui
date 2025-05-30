import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useEventCallback } from '../../utils/useEventCallback';

import type {
  FloatingRootContext,
  ReferenceElement,
  ContextData,
  OpenChangeReason,
} from '../types';
import { createEventEmitter } from '../utils/createEventEmitter';
import { useId } from '../../utils/useId';
import { useFloatingParentNodeId } from '../components/FloatingTree';

export interface UseFloatingRootContextOptions {
  open?: boolean;
  onOpenChange?: (open: boolean, event?: Event, reason?: OpenChangeReason) => void;
  elements: {
    reference: Element | null;
    floating: HTMLElement | null;
  };
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

  const onOpenChange = useEventCallback(
    (newOpen: boolean, event?: Event, reason?: OpenChangeReason) => {
      dataRef.current.openEvent = newOpen ? event : undefined;
      events.emit('openchange', { open: newOpen, event, reason, nested });
      onOpenChangeProp?.(newOpen, event, reason);
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
    }),
    [positionReference, elementsProp.reference, elementsProp.floating],
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
