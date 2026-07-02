'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { type CompositeMetadata, useCompositeListContext } from './CompositeListContext';

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

  const { register, unregister, subscribeMapChange, nextIndexRef } = useCompositeListContext();

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
  const componentRef = React.useRef<Element | null>(null);
  const ref = React.useCallback((node: HTMLElement | null) => {
    componentRef.current = node;
  }, []);

  useIsoLayoutEffect(() => {
    const node = componentRef.current;
    if (node) {
      const registeredMetadata: CompositeMetadata<Metadata> = {
        ...(metadata ?? ({} as Metadata)),
        index: externalIndex,
        label,
        textRef,
      };
      register(node, registeredMetadata);
      return () => {
        unregister(node);
      };
    }
    return undefined;
  }, [externalIndex, register, unregister, metadata, label, textRef]);

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
