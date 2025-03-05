'use client';
import * as React from 'react';
import { useCompositeRootContext } from '../root/CompositeRootContext';
import { useCompositeListItem } from '../list/useCompositeListItem';
import { mergeReactProps } from '../../utils/mergeReactProps';
import type { GenericHTMLProps } from '../../utils/types';

export interface UseCompositeItemParameters<Metadata> {
  metadata?: Metadata;
}

export function useCompositeItem<Metadata>(params: UseCompositeItemParameters<Metadata> = {}) {
  const { highlightedIndex, onHighlightedIndexChange } = useCompositeRootContext();
  const { ref, index } = useCompositeListItem(params);
  const isHighlighted = highlightedIndex === index;

  const getItemProps = React.useCallback(
    (externalProps: GenericHTMLProps = {}) =>
      mergeReactProps<'div'>(
        {
          tabIndex: isHighlighted ? 0 : -1,
          onFocus() {
            onHighlightedIndexChange(index);
          },
        },
        externalProps,
      ),
    [isHighlighted, index, onHighlightedIndexChange],
  );

  return React.useMemo(
    () => ({
      getItemProps,
      ref,
      index,
    }),
    [getItemProps, ref, index],
  );
}
