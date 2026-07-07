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
 * Used to register a list item and its index in the `CompositeList`.
 * The index is derived from DOM position, or from the explicit `index` when controlled.
 */
export function useCompositeListItem<Metadata>(
  params: UseCompositeListItemParameters<Metadata> = {},
): UseCompositeListItemReturnValue {
  const { label, metadata, textRef, indexGuessBehavior, index: externalIndex } = params;

  const { register, unregister, subscribeMapChange, labelsRef, nextIndexRef } =
    useCompositeListContext();

  const indexRef = React.useRef(-1);
  const [computedIndex, setIndex] = React.useState<number>(() => {
    if (externalIndex != null || indexGuessBehavior !== IndexGuessBehavior.GuessFromOrder) {
      return -1;
    }

    if (indexRef.current === -1) {
      const newIndex = nextIndexRef.current;
      nextIndexRef.current += 1;
      indexRef.current = newIndex;
    }
    return indexRef.current;
  });

  const index = externalIndex ?? computedIndex;
  const componentRef = React.useRef<HTMLElement | null>(null);
  const labelRef = React.useRef<string | null>(null);

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      componentRef.current = node;

      if (labelsRef && node !== null) {
        const labelText =
          label !== undefined ? label : (textRef?.current?.textContent ?? node.textContent);

        // Optimistically set it...
        if (index !== -1) {
          labelsRef.current[index] = labelText;
        }

        // And then store a local ref to pass to CompositeList during registration.
        // We want CompositeList to remain source of truth for item shifts.
        labelRef.current = labelText;
      }
    },
    [index, labelsRef, label, textRef],
  );

  useIsoLayoutEffect(() => {
    const node = componentRef.current;
    if (node) {
      register(node, {
        ...(metadata ?? ({} as Metadata)),
        index: externalIndex,
        labelRef,
      });
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
      const i = componentRef.current ? map.get(componentRef.current)?.index : null;

      if (i != null) {
        setIndex(i);
      }
    });
  }, [externalIndex, subscribeMapChange, setIndex]);

  return { ref, index };
}
