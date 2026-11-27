'use client';
import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useBaseUIFloating } from '../../src/utils/popups/positioning/useFloating';
import { useFloatingRootStore } from '../../src/utils/popups/floating-root/useFloatingRootStore';
import type { FloatingRootStore } from '../../src/utils/popups/floating-root/FloatingRootStore';
import type {
  NarrowedElement,
  ReferenceType,
  UseFloatingOptions,
  UseFloatingReturn,
} from '../../src/utils/popups/types';

/**
 * Floating UI's public `useFloating`: `refs.setReference` and `refs.setFloating` also register the
 * elements in the root store. Base UI components hand their elements to the store directly, so
 * only the ported Floating UI tests use this.
 */
export function useFloating(
  options: UseFloatingOptions & { nodeId?: string | undefined } = {},
): UseFloatingReturn {
  const internalStore = useFloatingRootStore({
    ...options,
    elements: {
      anchor: options.elements?.reference as Element | null | undefined,
      positionerElement: options.elements?.floating,
    },
  });
  // The ported Floating UI tests only pass stores created by `useFloatingRootStore`.
  const store = (options.rootStore as FloatingRootStore | undefined) || internalStore;
  const anchorElement = store.useState('anchorElement');

  const [localDomReference, setLocalDomReference] = React.useState<
    NarrowedElement<ReferenceType> | null | undefined
  >(undefined);
  const [localFloatingElement, setLocalFloatingElement] = React.useState<
    HTMLElement | null | undefined
  >(undefined);

  const localDomReferenceElement = isElement(localDomReference)
    ? (localDomReference as Element)
    : null;

  const syncedFloatingElement =
    localFloatingElement === undefined ? store.state.positionerElement : localFloatingElement;

  store.useSyncedValue(
    'anchorElement',
    localDomReference === undefined ? anchorElement : localDomReferenceElement,
  );
  store.useSyncedValue('positionerElement', syncedFloatingElement);

  const floating = useBaseUIFloating({ ...options, rootStore: store });
  const baseRefs = floating.refs;

  const setReference = React.useCallback(
    (node: ReferenceType | null) => {
      if (isElement(node) || node === null) {
        (baseRefs.domReference as React.RefObject<Element | null>).current = node;
        setLocalDomReference(node as NarrowedElement<ReferenceType> | null);
      }

      // Backwards-compatibility for passing a virtual element to `reference`
      // after it has set the DOM reference.
      if (
        isElement(baseRefs.reference.current) ||
        baseRefs.reference.current === null ||
        // Don't allow setting virtual elements using the old technique back to
        // `null` to support `anchorOverride` + an unstable `reference`
        // callback ref.
        (node !== null && !isElement(node))
      ) {
        baseRefs.setReference(node);
      }
    },
    [baseRefs],
  );

  const setFloating = React.useCallback(
    (node: HTMLElement | null) => {
      setLocalFloatingElement(node);
      baseRefs.setFloating(node);
    },
    [baseRefs],
  );

  const refs = React.useMemo(
    () => ({ ...baseRefs, setReference, setFloating }),
    [baseRefs, setReference, setFloating],
  );

  const context = React.useMemo(() => ({ ...floating.context, refs }), [floating.context, refs]);

  return React.useMemo(() => ({ ...floating, refs, context }), [floating, refs, context]);
}
