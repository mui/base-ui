'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useCompositeListContext } from './CompositeListContext';

export interface UseCompositeListItemParameters<Metadata> {
  /**
   * Whether to guess the initial index from render order, avoiding a re-render after mount for
   * flat lists.
   * @default false
   */
  guess?: boolean | undefined;
  index?: number | undefined;
  label?: string | null | undefined;
  metadata?: Metadata | undefined;
  textRef?: React.RefObject<HTMLElement | null> | undefined;
}

interface UseCompositeListItemReturnValue {
  ref: (node: HTMLElement | null) => void;
  index: number;
}

/**
 * Used to register a list item and its index (DOM position) in the `CompositeList`.
 */
export function useCompositeListItem<Metadata>(
  params: UseCompositeListItemParameters<Metadata> = {},
): UseCompositeListItemReturnValue {
  const { guess, label, metadata, textRef, index: externalIndex } = params;

  const { register, unregister, subscribeMapChange, nextIndexRef } = useCompositeListContext();

  // Guess the index from the registration order. This avoids a re-render after mount for
  // flat lists rendered in DOM order; when the guess is wrong (grouped or out-of-order
  // rendering), the commit flush corrects it before paint.
  const indexRef = React.useRef(-1);
  const [internalIndex, setInternalIndex] = React.useState<number>(
    externalIndex == null && guess
      ? () => {
          if (indexRef.current === -1) {
            const newIndex = nextIndexRef.current;
            nextIndexRef.current += 1;
            indexRef.current = newIndex;
          }
          return indexRef.current;
        }
      : -1,
  );
  const index = externalIndex ?? internalIndex;

  const componentRef = React.useRef<Element | null>(null);

  // Deliberately identity-sensitive: nested items sharing one DOM node rely on ref attachment
  // order to decide which registration wins, and republishing from an effect instead would let
  // an inner item's later update silently take ownership from the outer one.
  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      const previousNode = componentRef.current;

      if (previousNode) {
        unregister(previousNode);
      }

      componentRef.current = node;

      if (node) {
        register(node, {
          metadata: metadata ?? null,
          index: externalIndex ?? null,
          label,
          textRef,
        });
      }
    },
    [externalIndex, register, unregister, metadata, label, textRef],
  );

  useIsoLayoutEffect(() => {
    if (externalIndex != null) {
      return undefined;
    }

    return subscribeMapChange((map) => {
      const i = componentRef.current ? map.get(componentRef.current)?.index : null;

      if (i != null) {
        setInternalIndex(i);
      }
    });
  }, [externalIndex, subscribeMapChange]);

  return { ref, index };
}
