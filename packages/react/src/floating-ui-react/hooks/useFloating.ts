'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useFloating as usePosition, type VirtualElement } from '@floating-ui/react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { FloatingRootStore } from '../components/FloatingRootStore';
import { useFloatingTree } from '../components/FloatingTree';
import type {
  FloatingContext,
  NarrowedElement,
  ReferenceType,
  UseFloatingOptions,
  UseFloatingReturn,
} from '../types';

/**
 * Provides data to position a floating element and context to add interactions.
 * The caller supplies the root store, which owns the reference and floating elements.
 * @see https://floating-ui.com/docs/useFloating
 */
export function useBaseUIFloating(
  options: UseFloatingOptions & { rootContext: FloatingRootStore },
): UseFloatingReturn {
  const { nodeId, externalTree, rootContext: store } = options;

  const referenceElement = store.useState('referenceElement');
  const floatingElement = store.useState('floatingElement');
  const domReferenceElement = store.useState('domReferenceElement');
  const open = store.useState('open');
  const floatingId = store.useState('floatingId');

  const [positionReference, setPositionReferenceRaw] = React.useState<ReferenceType | null>(null);

  const domReferenceRef = React.useRef<NarrowedElement<ReferenceType> | null>(null);

  const tree = useFloatingTree(externalTree);

  const storeElements = React.useMemo(
    () => ({
      reference: referenceElement,
      floating: floatingElement,
      domReference: domReferenceElement,
    }),
    [referenceElement, floatingElement, domReferenceElement],
  );

  const position = usePosition({
    ...options,
    elements: {
      ...storeElements,
      ...(positionReference && { reference: positionReference }),
    },
  });

  const setPositionReference = React.useCallback(
    (node: ReferenceType | null) => {
      const computedPositionReference = isElement(node)
        ? ({
            getBoundingClientRect: () => node.getBoundingClientRect(),
            getClientRects: () => node.getClientRects(),
            contextElement: node,
          } satisfies VirtualElement)
        : node;
      // Store the positionReference in state if the DOM reference is specified externally via the
      // `elements.reference` option. This ensures that it won't be overridden on future renders.
      setPositionReferenceRaw(computedPositionReference);
      position.refs.setReference(computedPositionReference);
    },
    [position.refs],
  );

  const refs = React.useMemo(
    () => ({
      ...position.refs,
      setPositionReference,
      domReference: domReferenceRef,
    }),
    [position.refs, setPositionReference],
  );

  const elements = React.useMemo(
    () => ({
      ...position.elements,
      domReference: domReferenceElement,
    }),
    [position.elements, domReferenceElement],
  );

  const context = React.useMemo<FloatingContext>(
    () => ({
      ...position,
      dataRef: store.context.dataRef,
      open,
      onOpenChange: store.setOpen,
      events: store.context.events,
      floatingId,
      refs,
      elements,
      nodeId,
      rootStore: store,
    }),
    [position, refs, elements, nodeId, store, open, floatingId],
  );

  useIsoLayoutEffect(() => {
    if (domReferenceElement) {
      domReferenceRef.current = domReferenceElement as NarrowedElement<ReferenceType> | null;
    }
  }, [domReferenceElement]);

  useIsoLayoutEffect(() => {
    store.context.dataRef.current.floatingContext = context;

    const node = tree?.nodesRef.current.find((n) => n.id === nodeId);
    if (node) {
      node.context = context;
    }
  });

  return React.useMemo(
    () => ({
      ...position,
      context,
      refs,
      elements,
      rootStore: store as unknown as FloatingRootStore,
    }),
    [position, refs, elements, context, store],
  ) as UseFloatingReturn;
}
