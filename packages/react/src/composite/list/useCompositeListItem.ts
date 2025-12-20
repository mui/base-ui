'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useCompositeListContext } from './CompositeListContext';

export interface UseCompositeListItemParameters<Metadata> {
  index?: number | undefined;
  label?: (string | null) | undefined;
  metadata?: Metadata | undefined;
  textRef?: React.RefObject<HTMLElement | null> | undefined;
  /** Enables guessing the indexes. This avoids a re-render after mount, which is useful for
   * large lists. This should be used for lists that are likely flat and vertical, other cases
   * might trigger a re-render anyway. */
  indexGuessBehavior?: IndexGuessBehavior | undefined;
}

interface UseCompositeListItemReturnValue {
  ref: (node: HTMLElement | null) => void;
  index: number;
}

export enum IndexGuessBehavior {
  None,
  GuessFromOrder,
}

/**
 * Used to register a list item and its index (DOM position) in the `CompositeList`.
 */
export function useCompositeListItem<Metadata>(
  params: UseCompositeListItemParameters<Metadata> = {},
): UseCompositeListItemReturnValue {
  const { label, metadata, textRef, indexGuessBehavior, index: externalIndex } = params;

  const { register, unregister, subscribeMapChange, elementsRef, labelsRef, nextIndexRef } =
    useCompositeListContext();

  const indexRef = React.useRef(-1);
  const [index, setIndex] = React.useState<number>(
    externalIndex ??
      (indexGuessBehavior === IndexGuessBehavior.GuessFromOrder
        ? () => {
            if (indexRef.current === -1) {
              const newIndex = nextIndexRef.current;
              nextIndexRef.current += 1;
              indexRef.current = newIndex;
            }
            return indexRef.current;
          }
        : -1),
  );

  const componentRef = React.useRef<Element | null>(null);
  const registeredNodeRef = React.useRef<Element | null>(null);

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      componentRef.current = node;

      if (externalIndex == null && node && registeredNodeRef.current !== node) {
        const prevNode = registeredNodeRef.current;
        if (prevNode) {
          unregister(prevNode);
        }
        register(node, metadata);
        registeredNodeRef.current = node;
      }

      if (index !== -1 && node !== null) {
        elementsRef.current[index] = node;

        if (labelsRef) {
          const isLabelDefined = label !== undefined;
          labelsRef.current[index] = isLabelDefined
            ? label
            : (textRef?.current?.textContent ?? node.textContent);
        }
      }
    },
    [externalIndex, index, elementsRef, labelsRef, label, textRef, register, unregister, metadata],
  );

  useIsoLayoutEffect(() => {
    if (externalIndex != null) {
      return;
    }

    // Some components (e.g. Combobox.Item) render `null` when filtered out.
    // In that case, the component stays mounted (effects don't clean up), but the DOM node
    // disappears. Unregister the previously registered node after commit.
    if (componentRef.current == null && registeredNodeRef.current != null) {
      unregister(registeredNodeRef.current);
      registeredNodeRef.current = null;
      indexRef.current = -1;
    }
  });

  useIsoLayoutEffect(() => {
    if (externalIndex != null) {
      return undefined;
    }

    const node = registeredNodeRef.current || componentRef.current;
    if (!node) {
      return undefined;
    }

    register(node, metadata);
    return () => {
      unregister(node);
    };
  }, [externalIndex, register, unregister, metadata]);

  useIsoLayoutEffect(() => {
    if (externalIndex != null) {
      return undefined;
    }

    return subscribeMapChange((map) => {
      const lookupNode = registeredNodeRef.current || componentRef.current;
      const i = lookupNode ? map.get(lookupNode)?.index : null;
      setIndex(i != null ? i : -1);
    });
  }, [externalIndex, subscribeMapChange, setIndex]);

  return {
    ref,
    index,
  };
}
