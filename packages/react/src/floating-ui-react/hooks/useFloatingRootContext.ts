import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useId } from '@base-ui-components/utils/useId';

import type {
  FloatingRootContext,
  ReferenceElement,
  ContextData,
  OpenChangeReason,
  OpenChangeCallback,
} from '../types';
import { createEventEmitter } from '../utils/createEventEmitter';
import { useFloatingParentNodeId } from '../components/FloatingTree';

export interface UseFloatingRootContextOptions {
  open?: boolean;
  onOpenChange?: OpenChangeCallback;
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

  const onOpenChange = useEventCallback(
    (
      newOpen: boolean,
      event: Event | undefined,
      reason: OpenChangeReason | undefined,
      triggerElement: Element | undefined,
    ) => {
      dataRef.current.openEvent = newOpen ? event : undefined;
      if (!options.noEmit) {
        events.emit('openchange', { open: newOpen, event, reason, nested, triggerElement });
      }
      onOpenChangeProp?.(newOpen, event, reason, triggerElement);
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

export function getEmptyContext(): FloatingRootContext {
  return {
    open: false,
    onOpenChange: () => {},
    dataRef: { current: {} },
    elements: {
      floating: null,
      reference: null,
      domReference: null,
      triggers: [],
    },
    events: {
      on: () => {},
      off: () => {},
      emit: () => {},
    },
    floatingId: '',
    refs: {
      setPositionReference: () => {},
    },
  };
}
