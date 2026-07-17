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

const GUESS_FROM_ORDER = 1;

export const IndexGuessBehavior = {
  None: 0,
  GuessFromOrder: GUESS_FROM_ORDER,
} as const;
export type IndexGuessBehavior = (typeof IndexGuessBehavior)[keyof typeof IndexGuessBehavior];

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
  const [internalIndex, setInternalIndex] = React.useState<number>(
    indexGuessBehavior === GUESS_FROM_ORDER
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

  const componentRef = React.useRef<HTMLElement | null>(null);

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      componentRef.current = node;

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
    [index, elementsRef, labelsRef, label, textRef],
  );

  const previousExternalIndexRef = React.useRef(externalIndex);
  useIsoLayoutEffect(() => {
    const previousExternalIndex = previousExternalIndexRef.current;
    if (previousExternalIndex != null && previousExternalIndex !== externalIndex) {
      elementsRef.current[previousExternalIndex] = null;
      if (labelsRef) {
        labelsRef.current[previousExternalIndex] = null;
      }
    }

    if (externalIndex != null) {
      // React 18 Strict Mode replays effects without reattaching callback refs. Re-publish the
      // externally indexed element after the parent list clears its refs during that replay.
      ref(componentRef.current);
    }
    previousExternalIndexRef.current = externalIndex;
  }, [elementsRef, externalIndex, labelsRef, ref]);

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
      const i = componentRef.current ? map.get(componentRef.current)?.index : null;

      if (i != null) {
        setInternalIndex(i);
      }
    });
  }, [externalIndex, subscribeMapChange, setInternalIndex]);

  return { ref, index };
}
