import * as React from 'react';
import { useFloating as usePosition, type VirtualElement } from '@floating-ui/react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';

import { useFloatingTree } from '../components/FloatingTree';
import type {
  FloatingContext,
  NarrowedElement,
  ReferenceType,
  UseFloatingOptions,
  UseFloatingReturn,
} from '../types';
import { useFloatingRootContext } from './useFloatingRootContext';
import { FloatingRootContextStore } from '../components/FloatingRootContextStore';

/**
 * Provides data to position a floating element and context to add interactions.
 * @see https://floating-ui.com/docs/useFloating
 */
export function useFloating<RT extends ReferenceType = ReferenceType>(
  options: UseFloatingOptions = {},
): UseFloatingReturn<RT> {
  const { nodeId, externalTree } = options;

  const internalRootContext = useFloatingRootContext(options);

  const rootContext = options.rootContext || internalRootContext;
  const rootContextElements = {
    reference: rootContext.useState('referenceElement'),
    floating: rootContext.useState('floatingElement'),
    triggers: rootContext.useState('triggerElements'),
    domReference: rootContext.useState('domReferenceElement'),
  };

  const [positionReference, setPositionReferenceRaw] = React.useState<ReferenceType | null>(null);

  const domReferenceRef = React.useRef<NarrowedElement<RT> | null>(null);

  const tree = useFloatingTree(externalTree);

  useIsoLayoutEffect(() => {
    if (rootContextElements.domReference) {
      domReferenceRef.current = rootContextElements.domReference as NarrowedElement<RT> | null;
    }
  }, [rootContextElements.domReference]);

  const position = usePosition({
    ...options,
    elements: {
      ...rootContextElements,
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

  const [localDomReference, setLocalDomReference] = React.useState<NarrowedElement<RT> | null>(
    null,
  );
  const [localFloatingElement, setLocalFloatingElement] = React.useState<HTMLElement | null>(null);
  rootContext.useSyncedValue('referenceElement', localDomReference);
  rootContext.useSyncedValue(
    'domReferenceElement',
    isElement(localDomReference) ? (localDomReference as Element) : null,
  );
  rootContext.useSyncedValue('floatingElement', localFloatingElement);

  const setReference = React.useCallback(
    (node: RT | null) => {
      if (isElement(node) || node === null) {
        (domReferenceRef as React.MutableRefObject<Element | null>).current = node;
        setLocalDomReference(node as NarrowedElement<RT> | null);
      }

      // Backwards-compatibility for passing a virtual element to `reference`
      // after it has set the DOM reference.
      if (
        isElement(position.refs.reference.current) ||
        position.refs.reference.current === null ||
        // Don't allow setting virtual elements using the old technique back to
        // `null` to support `positionReference` + an unstable `reference`
        // callback ref.
        (node !== null && !isElement(node))
      ) {
        position.refs.setReference(node);
      }
    },
    [position.refs, setLocalDomReference],
  );

  const setFloating = React.useCallback(
    (node: HTMLElement | null) => {
      setLocalFloatingElement(node);
      position.refs.setFloating(node);
    },
    [position.refs],
  );

  const refs = React.useMemo(
    () => ({
      ...position.refs,
      setReference,
      setFloating,
      setPositionReference,
      domReference: domReferenceRef,
    }),
    [position.refs, setReference, setFloating, setPositionReference],
  );

  const elements = React.useMemo(
    () => ({
      ...position.elements,
      domReference: rootContextElements.domReference as NarrowedElement<RT> | null,
      triggers: rootContextElements.triggers,
    }),
    [position.elements, rootContextElements.domReference, rootContextElements?.triggers],
  );

  const open = rootContext.useState('open');
  const floatingId = rootContext.useState('floatingId');

  const context = React.useMemo<FloatingContext<RT>>(
    () => ({
      ...position,
      dataRef: rootContext.context.dataRef,
      open,
      onOpenChange: rootContext.setOpen,
      events: rootContext.context.events,
      floatingId,
      refs,
      elements,
      nodeId,
      rootStore: rootContext as unknown as FloatingRootContextStore<RT>,
    }),
    [position, refs, elements, nodeId, rootContext, open, floatingId],
  );

  useIsoLayoutEffect(() => {
    rootContext.context.dataRef.current.floatingContext = context as FloatingContext<any>;

    const node = tree?.nodesRef.current.find((n) => n.id === nodeId);
    if (node) {
      node.context = context as FloatingContext<any>;
    }
  });

  return React.useMemo(
    () => ({
      ...position,
      context,
      refs,
      elements,
      rootStore: rootContext as unknown as FloatingRootContextStore<RT>,
    }),
    [position, refs, elements, context, rootContext],
  ) as UseFloatingReturn<RT>;
}
