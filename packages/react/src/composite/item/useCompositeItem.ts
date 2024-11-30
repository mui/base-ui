'use client';
import * as React from 'react';
import { useCompositeRootContext } from '../root/CompositeRootContext';
import { useCompositeListItem } from '../list/useCompositeListItem';
import { mergeReactProps } from '../../utils/mergeReactProps';

export interface UseCompositeItemParameters<Metadata> {
  metadata?: Metadata;
}

/**
 *
 * API:
 *
 * - [useCompositeItem API](https://mui.com/base-ui/api/use-composite-item/)
 */
export function useCompositeItem<Metadata>(params: UseCompositeItemParameters<Metadata> = {}) {
  const { highlightedIndex, onHighlightedIndexChange } = useCompositeRootContext();
  const { ref, index } = useCompositeListItem(params);
  const isHighlighted = highlightedIndex === index;

  const getItemProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        tabIndex: isHighlighted ? 0 : -1,
        onFocus() {
          onHighlightedIndexChange(index);
        },
      }),
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
