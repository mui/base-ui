'use client';
import * as React from 'react';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useCompositeListContext } from './CompositeListContext';

export interface UseCompositeListItemParameters<Metadata> {
  label?: string | null;
  metadata?: Metadata;
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
  const { label, metadata } = params;

  const { register, unregister, map, elementsRef, labelsRef } = useCompositeListContext();

  const [index, setIndex] = React.useState<number | null>(null);

  const componentRef = React.useRef<Element | null>(null);

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      componentRef.current = node;

      if (index !== null) {
        elementsRef.current[index] = node;
        if (labelsRef) {
          const isLabelDefined = label !== undefined;
          labelsRef.current[index] = isLabelDefined ? label : (node?.textContent ?? null);
        }
      }
    },
    [index, elementsRef, labelsRef, label],
  );

  useEnhancedEffect(() => {
    const node = componentRef.current;
    if (node) {
      register(node, metadata);
      return () => {
        unregister(node);
      };
    }
    return undefined;
  }, [register, unregister, metadata]);

  useEnhancedEffect(() => {
    const i = componentRef.current ? map.get(componentRef.current)?.index : null;

    if (i != null) {
      setIndex(i);
    }
  }, [map]);

  return React.useMemo(
    () => ({
      ref,
      index: index == null ? -1 : index,
    }),
    [index, ref],
  );
}
