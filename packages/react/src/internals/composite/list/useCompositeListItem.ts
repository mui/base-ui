'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
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
  /**
   * Metadata published with the item. Keep object values referentially stable to avoid
   * unnecessarily detaching and reattaching the callback ref.
   */
  metadata?: Metadata | undefined;
  /** Keep the ref object stable to avoid unnecessarily reattaching the item. */
  textRef?: React.RefObject<HTMLElement | null> | undefined;
}

interface UseCompositeListItemReturnValue {
  ref: (node: HTMLElement | null) => void;
  index: number;
}

interface CompositeListItemHandle {
  element: Element | null;
  /** The index the item renders with: the initial guess, then the last one the list delivered. */
  index: number;
  setIndex: (index: number) => void;
}

/**
 * Used to register a list item and its index (DOM position) in the `CompositeList`.
 */
export function useCompositeListItem<Metadata>(
  params: UseCompositeListItemParameters<Metadata> = {},
): UseCompositeListItemReturnValue {
  const { guess, label, metadata, textRef, index: externalIndex } = params;

  const { register, unregister, guessIndex } = useCompositeListContext();

  // Guess the index from the render order. This avoids a re-render after mount for
  // flat lists rendered in DOM order; when the guess is wrong (grouped or out-of-order
  // rendering), the commit flush corrects it before paint. Strict Mode invokes the
  // initializer twice per render, so the guess is scoped to the render to reserve one index.
  let guessedIndex = -1;
  const [internalIndex, setInternalIndex] = React.useState<number>(
    externalIndex == null && guess
      ? () => {
          if (guessedIndex === -1) {
            guessedIndex = guessIndex();
          }
          return guessedIndex;
        }
      : -1,
  );
  const index = externalIndex ?? internalIndex;

  const handle = useRefWithInit(() => createHandle(internalIndex, setInternalIndex)).current;

  // Deliberately identity-sensitive: nested items sharing one DOM node rely on ref attachment
  // order to decide which registration wins, and republishing from an effect instead would let
  // an inner item's later update silently take ownership from the outer one.
  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      if (handle.element) {
        unregister(handle.element);
      }

      handle.element = node;

      if (node) {
        register(node, {
          metadata: metadata ?? null,
          index: externalIndex ?? null,
          label,
          textRef,
          setIndex: handle.setIndex,
        });
      }
    },
    [externalIndex, register, unregister, metadata, label, textRef, handle],
  );

  return { ref, index };
}

function createHandle(
  initialIndex: number,
  setInternalIndex: React.Dispatch<React.SetStateAction<number>>,
): CompositeListItemHandle {
  const handle: CompositeListItemHandle = {
    element: null,
    index: initialIndex,
    setIndex(index) {
      // React only bails out of a same-value update eagerly when the fiber has no pending work,
      // so an unchanged index is filtered here to spare the item a render.
      if (handle.index !== index) {
        handle.index = index;
        setInternalIndex(index);
      }
    },
  };
  return handle;
}
