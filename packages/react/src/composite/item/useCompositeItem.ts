'use client';
import * as React from 'react';
import { useCompositeRootContext } from '../root/CompositeRootContext';
import { useCompositeListItem } from '../list/useCompositeListItem';
import { mergeProps } from '../../merge-props';
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

  const getItemProps = React.useCallback(
    <T extends React.ElementType = 'div'>(externalProps = {}) =>
      mergeProps<T>(
        // @ts-ignore tabIndex as number
        {
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
        },
        externalProps,
        {
          tabIndex: isHighlighted ? 0 : -1,
        },
      ),
    [isHighlighted, index, onHighlightedIndexChange, highlightItemOnHover],
  );

  return React.useMemo(
    () => ({
      getItemProps,
      ref: mergedRef as React.RefCallback<HTMLElement | null>,
      index,
    }),
    [getItemProps, index, mergedRef],
  );
}
