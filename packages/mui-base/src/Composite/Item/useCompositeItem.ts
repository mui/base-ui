'use client';

import * as React from 'react';
import { useCompositeRootContext } from '../Root/CompositeRootContext';
import { useCompositeListItem } from '../List/useCompositeListItem';
import { mergeReactProps } from '../../utils/mergeReactProps';

/**
 *
 * API:
 *
 * - [useCompositeItem API](https://mui.com/base-ui/api/use-composite-item/)
 */
export function useCompositeItem() {
  const { activeIndex, onActiveIndexChange } = useCompositeRootContext();
  const { ref, index } = useCompositeListItem();
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
