'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useCompositeListContext } from './CompositeListContext';

export interface UseCompositeListItemParameters<Metadata> {
  index?: number | undefined;
  label?: string | null | undefined;
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

  const componentRef = React.useRef<HTMLElement | null>(null);

  const syncRefs = React.useCallback(
    (node: HTMLElement, i: number) => {
      elementsRef.current[i] = node;

      if (labelsRef) {
        const isLabelDefined = label !== undefined;
        labelsRef.current[i] = isLabelDefined
          ? label
          : (textRef?.current?.textContent ?? node.textContent);
      }
    },
    [elementsRef, labelsRef, label, textRef],
  );

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      componentRef.current = node;

      if (index !== -1 && node !== null) {
        syncRefs(node, index);
      }
    },
    [index, syncRefs],
  );

  useIsoLayoutEffect(() => {
    if (externalIndex != null) {
      return undefined;
    }

    const node = componentRef.current;
    if (node) {
      register(node, metadata);
      return () => {
        unregister(node);
      };
    }
    return undefined;
  }, [externalIndex, register, unregister, metadata]);

  useIsoLayoutEffect(() => {
    if (externalIndex != null) {
      return undefined;
    }

    return subscribeMapChange((map) => {
      const node = componentRef.current;
      const i = node ? map.get(node)?.index : null;

      if (node && i != null) {
        setIndex(i);
        // Write the refs even when the index didn't change and the item won't
        // re-render: a React StrictMode dev remount re-runs `CompositeList`'s
        // cleanup (which empties the ref arrays) without re-invoking the item
        // ref callbacks that originally filled them.
        if (elementsRef.current[i] !== node) {
          syncRefs(node, i);
        }
      }
    });
  }, [externalIndex, subscribeMapChange, setIndex, syncRefs, elementsRef]);

  return { ref, index };
}
