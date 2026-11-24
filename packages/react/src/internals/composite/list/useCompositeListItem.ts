'use client';
import * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';
import { useCompositeListContext } from './CompositeListContext';
import type { CompositeListContextValue, CompositeListRegistration } from './CompositeListContext';

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
  /**
   * The list to register with, in place of the one provided through `CompositeListContext`.
   * Pass it on every render of the item or on none.
   */
  list?: CompositeListContextValue<Metadata> | undefined;
}

interface UseCompositeListItemReturnValue {
  ref: (node: HTMLElement | null) => void;
  index: number;
}

interface CompositeListItemHandle<Metadata> {
  element: Element | null;
  /** The index the item renders with: the initial guess, then the last one the list delivered. */
  index: number;
  setIndex: (index: number) => void;
  /** The registration the ref attaches, and the list it registers with. */
  registration: CompositeListRegistration<Metadata> | null;
  list: CompositeListContextValue<Metadata> | null;
  /** The value last returned, kept while its ref and index are unchanged. */
  result: UseCompositeListItemReturnValue;
}

const NO_PARAMETERS = {};

/** Stands in for the result until the first render, which always replaces it. */
const UNSET_RESULT: UseCompositeListItemReturnValue = { ref: NOOP, index: -1 };

/**
 * Used to register a list item and its index (DOM position) in the `CompositeList`.
 */
export function useCompositeListItem<Metadata>(
  params: UseCompositeListItemParameters<Metadata> = NO_PARAMETERS,
): UseCompositeListItemReturnValue {
  const { guess, label, metadata = null, textRef, index: externalIndex } = params;
  const explicitIndex = externalIndex ?? null;
  // The context is only read without an explicit list, which callers pass on every render or
  // never, so the hook order holds while explicit lists spare each render a context dependency.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const list = params.list ?? useCompositeListContext();

  // Items can render by the thousand, in long lists or across data grid cells, so a render
  // allocates nothing unless the registration changes: the state lives in this handle rather than
  // in initializer closures and `useCallback` dependency arrays.
  const handleRef = React.useRef<CompositeListItemHandle<Metadata> | null>(null);

  // Guess the index from the render order. This avoids a re-render after mount for
  // flat lists rendered in DOM order; when the guess is wrong (grouped or out-of-order
  // rendering), the commit flush corrects it before paint.
  const [internalIndex, setInternalIndex] = React.useState<number>(
    handleRef.current === null && explicitIndex === null && guess ? list.guessIndex() : -1,
  );
  const index = explicitIndex ?? internalIndex;

  let handle = handleRef.current;
  if (handle === null) {
    handle = createHandle(internalIndex, setInternalIndex);
    handleRef.current = handle;
  }

  // Deliberately identity-sensitive: nested items sharing one DOM node rely on ref attachment
  // order to decide which registration wins, and republishing from an effect instead would let
  // an inner item's later update silently take ownership from the outer one.
  const { registration } = handle;
  if (
    registration === null ||
    registration.metadata !== metadata ||
    registration.index !== explicitIndex ||
    registration.label !== label ||
    registration.textRef !== textRef ||
    handle.list !== list
  ) {
    const nextRegistration: CompositeListRegistration<Metadata> = {
      metadata,
      index: explicitIndex,
      label,
      textRef,
      setIndex: handle.setIndex,
    };
    handle.registration = nextRegistration;
    handle.list = list;
    handle.result = { ref: createRef(handle, nextRegistration, list), index };
  } else if (handle.result.index !== index) {
    handle.result = { ref: handle.result.ref, index };
  }

  return handle.result;
}

function createHandle<Metadata>(
  initialIndex: number,
  setInternalIndex: React.Dispatch<React.SetStateAction<number>>,
): CompositeListItemHandle<Metadata> {
  const handle: CompositeListItemHandle<Metadata> = {
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
    registration: null,
    list: null,
    result: UNSET_RESULT,
  };
  return handle;
}

function createRef<Metadata>(
  handle: CompositeListItemHandle<Metadata>,
  registration: CompositeListRegistration<Metadata>,
  list: CompositeListContextValue<Metadata>,
) {
  return (node: HTMLElement | null) => {
    if (handle.element) {
      list.unregister(handle.element);
    }

    handle.element = node;

    if (node) {
      list.register(node, registration);
    }
  };
}
