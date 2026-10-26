'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useFloating as usePosition } from '@floating-ui/react-dom';
import type { VirtualElement } from '@floating-ui/react-dom';
import { isElement } from '@floating-ui/utils/dom';
import { useFloatingTree } from '../tree/FloatingTree';
import type {
  FloatingNodeSnapshot,
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
  options: UseFloatingOptions & { rootStore: PopupInteractionStore },
): UseFloatingReturn {
  const { nodeId, externalTree, rootStore: store } = options;

  const anchor = store.useState('anchor');
  const positionerElement = store.useState('positionerElement');
  const anchorElement = store.useState('anchorElement');
  const open = store.useState('open');
  const defaultPopupId = store.useState('defaultPopupId');

  const [positionerAnchor, setPositionerAnchor] = React.useState<ReferenceType | null>(null);

  const domReferenceRef = React.useRef<NarrowedElement<ReferenceType> | null>(null);

  const tree = useFloatingTree(externalTree);

  const storeElements = React.useMemo(
    () => ({
      reference: anchor,
      floating: positionerElement,
      domReference: anchorElement,
    }),
    [anchor, positionerElement, anchorElement],
  );

  const position = usePosition({
    ...options,
    elements: {
      ...storeElements,
      ...(positionerAnchor && { reference: positionerAnchor }),
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
      // Keep the Positioner's anchor in state when the store also has an anchor, so the store's
      // doesn't replace it on future renders.
      setPositionerAnchor(computedPositionReference);
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
      open,
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

  const snapshot = React.useMemo<FloatingNodeSnapshot>(
    () => ({ open, elements, interaction: store.context }),
    [open, elements, store],
  );

  useIsoLayoutEffect(() => {
    store.context.positioning = positioning;

    const node = tree?.getNode(nodeId);
    if (node) {
      node.context = snapshot;
    }
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
