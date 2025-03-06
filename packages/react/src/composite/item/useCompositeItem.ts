'use client';
import * as React from 'react';
import { useCompositeRootContext } from '../root/CompositeRootContext';
import { useCompositeListItem } from '../list/useCompositeListItem';
import { mergeProps } from '../../merge-props';

export interface UseCompositeItemParameters<Metadata> {
  metadata?: Metadata;
}

export function useCompositeItem<Metadata>(params: UseCompositeItemParameters<Metadata> = {}) {
  const { highlightedIndex, onHighlightedIndexChange } = useCompositeRootContext();
  const { ref, index } = useCompositeListItem(params);
  const isHighlighted = highlightedIndex === index;

  const getItemProps = React.useCallback(
    <T extends React.ElementType = 'div'>(externalProps = {}) =>
      mergeProps<T>(
        // @ts-ignore tabIndex as number
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
