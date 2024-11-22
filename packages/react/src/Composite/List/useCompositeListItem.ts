'use client';
import * as React from 'react';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import { useCompositeListContext } from './CompositeListContext';

export interface UseCompositeListItemParameters {
  label?: string | null;
}

interface UseCompositeListItemReturnValue {
  ref: (node: HTMLElement | null) => void;
  index: number;
}

/**
 * Used to register a list item and its index (DOM position) in the
 * `CompositeList`.
 *
 * API:
 *
 * - [useCompositeListItem API](https://mui.com/base-ui/api/use-composite-list-item/)
 */
export function useCompositeListItem(
  params: UseCompositeListItemParameters = {},
): UseCompositeListItemReturnValue {
  const { label } = params;

  const { register, unregister, map, elementsRef, labelsRef } = useCompositeListContext();

  const [index, setIndex] = React.useState<number | null>(null);

  const componentRef = React.useRef<Node | null>(null);

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
      register(node);
      return () => {
        unregister(node);
      };
    }
    return undefined;
  }, [register, unregister]);

  useEnhancedEffect(() => {
    const i = componentRef.current ? map.get(componentRef.current) : null;
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
