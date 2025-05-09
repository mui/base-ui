'use client';
import * as React from 'react';
import { useCompositeRootContext } from '../root/CompositeRootContext';
import { useCompositeListItem } from '../list/useCompositeListItem';
import { HTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils';

export interface UseCompositeItemParameters<Metadata> {
  metadata?: Metadata;
}

export function useCompositeItem<Metadata>(params: UseCompositeItemParameters<Metadata> = {}) {
  const { highlightedIndex, onHighlightedIndexChange, highlightItemOnHover } =
    useCompositeRootContext();
  const { ref, index } = useCompositeListItem(params);
  const isHighlighted = highlightedIndex === index;

  const itemRef = React.useRef<HTMLElement | null>(null);
  const mergedRef = useForkRef(ref, itemRef);

  const props = React.useMemo<HTMLProps>(
    () => ({
      tabIndex: isHighlighted ? 0 : -1,
      onFocus() {
        onHighlightedIndexChange(index);
      },
      onMouseMove() {
        const item = itemRef.current;
        if (!highlightItemOnHover || !item) {
          return;
        }

        const disabled = item.hasAttribute('disabled') || item.ariaDisabled === 'true';
        if (!isHighlighted && !disabled) {
          item.focus();
        }
      },
    }),
    [index, isHighlighted, onHighlightedIndexChange, highlightItemOnHover],
  );

  return React.useMemo(
    () => ({
      props,
      ref: mergedRef as React.RefCallback<HTMLElement | null>,
      index,
    }),
    [props, index, mergedRef],
  );
}
