'use client';
import * as React from 'react';
import { useCompositeRootContext } from '../root/CompositeRootContext';
import { useCompositeListItem } from '../list/useCompositeListItem';

export interface UseCompositeItemParameters<Metadata> {
  metadata?: Metadata;
}

export function useCompositeItem<Metadata>(params: UseCompositeItemParameters<Metadata> = {}) {
  const { highlightedIndex, onHighlightedIndexChange } = useCompositeRootContext();
  const { ref, index } = useCompositeListItem(params);
  const isHighlighted = highlightedIndex === index;

  const props = React.useMemo(
    () => ({
      tabIndex: isHighlighted ? 0 : -1,
      onFocus() {
        onHighlightedIndexChange(index);
      },
    }),
    [index, isHighlighted, onHighlightedIndexChange],
  );

  return React.useMemo(
    () => ({
      props,
      ref,
      index,
    }),
    [props, ref, index],
  );
}
