'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useFloating as usePosition } from '@floating-ui/react-dom';
import type { VirtualElement } from '@floating-ui/react-dom';
import { isElement } from '@floating-ui/utils/dom';
import type {
  FloatingPositioningData,
  PopupPositioningContext,
  PopupInteractionStore,
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
  options: UseFloatingOptions & { rootContext: PopupInteractionStore },
): UseFloatingReturn {
  const { nodeId, rootContext: store } = options;

  const anchor = store.useState('anchor');
  const outerPopupElement = store.useState('outerPopupElement');
  const anchorElement = store.useState('anchorElement');
  const open = store.useState('open');
  const defaultPopupId = store.useState('defaultPopupId');

  const [anchorOverride, setPositionReferenceRaw] = React.useState<ReferenceType | null>(null);

  const domReferenceRef = React.useRef<NarrowedElement<ReferenceType> | null>(null);

  const storeElements = React.useMemo(
    () => ({
      reference: anchor,
      floating: outerPopupElement,
      domReference: anchorElement,
    }),
    [anchor, outerPopupElement, anchorElement],
  );

  const position = usePosition({
    ...options,
    elements: {
      ...storeElements,
      ...(anchorOverride && { reference: anchorOverride }),
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
      // Keep the override in state when the anchor element comes from the store, so it isn't
      // overridden on future renders.
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
      domReference: anchorElement,
    }),
    [position.elements, anchorElement],
  );

  const context = React.useMemo<PopupPositioningContext>(
    () => ({
      ...position,
      dataRef: store.context.dataRef,
      open,
      onOpenChange: store.setOpen,
      events: store.context.events,
      defaultPopupId,
      refs,
      elements,
      nodeId,
      rootStore: store,
    }),
    [position, refs, elements, nodeId, store, open, defaultPopupId],
  );

  useIsoLayoutEffect(() => {
    if (anchorElement) {
      domReferenceRef.current = anchorElement as NarrowedElement<ReferenceType> | null;
    }
  }, [anchorElement]);

  const positioning = React.useMemo<FloatingPositioningData>(
    () => ({
      placement: position.placement,
      elements,
      nodeId,
      refs: { floating: position.refs.floating },
    }),
    [position.placement, elements, nodeId, position.refs.floating],
  );

  useIsoLayoutEffect(() => {
    store.context.dataRef.current.positioning = positioning;
  });

  return React.useMemo(
    () => ({
      ...position,
      context,
      refs,
      elements,
      rootStore: store,
    }),
    [position, refs, elements, context, store],
  ) as UseFloatingReturn;
}
