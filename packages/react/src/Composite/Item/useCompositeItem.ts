'use client';
import * as React from 'react';
import { useCompositeRootContext } from '../Root/CompositeRootContext';
import { useCompositeListItem } from '../List/useCompositeListItem';
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
  const { activeIndex, onActiveIndexChange } = useCompositeRootContext();
  const { ref, index } = useCompositeListItem(params);
  const isActive = activeIndex === index;

  const getItemProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        tabIndex: isActive ? 0 : -1,
        onFocus() {
          onActiveIndexChange(index);
        },
      }),
    [isActive, index, onActiveIndexChange],
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
