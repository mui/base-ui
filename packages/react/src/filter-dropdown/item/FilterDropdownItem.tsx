'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownPopupContext } from '../popup/FilterDropdownPopupContext';
import { selectors } from '../store';

/**
 * @internal
 */
export const FilterDropdownItem = React.memo(
  React.forwardRef(function FilterDropdownItem(
    componentProps: FilterDropdownItem.Props,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { render, className, style, label, ...elementProps } = componentProps;
    const popupContext = useFilterDropdownPopupContext();
    const itemId = useRefWithInit(() => Symbol('filter-dropdown-item')).current;
    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const prevTextContentRef = React.useRef<string | undefined>(undefined);
    const [hasRegistered, setHasRegistered] = React.useState(false);
    const visible = useStore(popupContext.store, selectors.isItemVisible, itemId);
    const registerItem = useStableCallback(popupContext.registerItem);

    useIsoLayoutEffect(() => {
      const getFilterText = () => {
        const textContent = itemRef.current?.textContent ?? prevTextContentRef.current;
        if (textContent) {
          prevTextContentRef.current = textContent;
        }
        return label ?? textContent;
      };

      // Cache the text content so we have a reference to it when the item is unmounted.
      prevTextContentRef.current = getFilterText();
      setHasRegistered(true);
      return registerItem(itemId, getFilterText);
    }, [itemId, registerItem, label]);

    const element = useRenderElement('div', componentProps, {
      enabled: !hasRegistered || visible,
      ref: [forwardedRef, itemRef],
      props: [{ role: 'menuitem' }, elementProps],
    });

    // The popup could open for the first time with a value that filters this item out, so we
    // render an unregistered item once to read and cache its DOM text before a non-match
    // removes the element. Later filters use the cached text while the item is hidden.
    return !hasRegistered || visible ? element : null;
  }),
);

export interface FilterDropdownItemProps extends BaseUIComponentProps<'div', {}> {
  /**
   * A text representation of the item used for filtering.
   */
  label?: string | undefined;
}

export namespace FilterDropdownItem {
  export type Props = FilterDropdownItemProps;
}
