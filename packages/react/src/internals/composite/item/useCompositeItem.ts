'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import { useCompositeRootContext } from '../root/CompositeRootContext';
import { useCompositeListItem } from '../list/useCompositeListItem';
import type { UseCompositeListItemParameters } from '../list/useCompositeListItem';
import type { HTMLProps } from '../../types';

export interface UseCompositeItemParameters<Metadata> extends Pick<
  UseCompositeListItemParameters<Metadata>,
  'metadata'
> {}

export function useCompositeItem<Metadata>(params: UseCompositeItemParameters<Metadata> = {}) {
  const { highlightItemOnHover, highlightedIndex, onHighlightedIndexChange } =
    useCompositeRootContext();
  const { ref, index } = useCompositeListItem({ ...params, guess: true });

  const isHighlighted = highlightedIndex === index;

  const itemRef = React.useRef<HTMLElement | null>(null);
  const mergedRef = useMergedRefs(ref, itemRef);

  const compositeProps: HTMLProps = {
    tabIndex: isHighlighted ? 0 : -1,
    onFocus() {
      onHighlightedIndexChange(index);
    },
    onMouseMove() {
      const item = itemRef.current;
      if (!highlightItemOnHover || !item) {
        return;
      }

      if (!isHighlighted && !isElementDisabled(item)) {
        item.focus();
      }
    },
  };

  return {
    compositeProps,
    compositeRef: mergedRef as React.RefCallback<HTMLElement | null>,
    index,
  };
}
