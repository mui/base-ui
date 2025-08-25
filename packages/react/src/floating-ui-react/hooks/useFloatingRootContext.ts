import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useId } from '@base-ui-components/utils/useId';

import type { FloatingRootContext, ReferenceElement, ContextData } from '../types';
import type { BaseUIEventData } from '../../utils/createBaseUIEventData';
import { createEventEmitter } from '../utils/createEventEmitter';
import { useFloatingParentNodeId } from '../components/FloatingTree';

export interface UseFloatingRootContextOptions {
  open?: boolean;
  onOpenChange?: (open: boolean, data: BaseUIEventData) => void;
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

  const onOpenChange = useEventCallback((newOpen: boolean, data: BaseUIEventData) => {
    dataRef.current.openEvent = newOpen ? data.event : undefined;
    events.emit('openchange', { open: newOpen, event: data.event, data, nested });
    onOpenChangeProp?.(newOpen, data);
  });

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
