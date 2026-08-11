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
import { useFilterDropdownGroupContext } from '../group/FilterDropdownGroupContext';

/**
 * @internal
 */
export const FilterDropdownItem = React.memo(
  React.forwardRef(function FilterDropdownItem(
    componentProps: FilterDropdownItem.Props,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const { render, className, style, label, keywords, ...elementProps } = componentProps;
    const popupContext = useFilterDropdownPopupContext();
    const itemId = useRefWithInit(() => Symbol('filter-dropdown-item')).current;
    const itemRef = React.useRef<HTMLDivElement | null>(null);
    const prevTextContentRef = React.useRef<string | undefined>(undefined);
    const [hasRegistered, setHasRegistered] = React.useState(false);
    const [domTextVersion, setDomTextVersion] = React.useState(0);
    const visible = useStore(popupContext.store, selectors.isItemVisible, itemId);
    const registerItem = useStableCallback(popupContext.registerItem);
    const groupContext = useFilterDropdownGroupContext();

    useIsoLayoutEffect(() => {
      return groupContext?.registerItem(itemId);
    }, [groupContext, itemId]);

    useIsoLayoutEffect(() => {
      const getFilterText = () => {
        // Return the label before touching the DOM; reading `textContent` is only a fallback.
        if (label != null) {
          return label;
        }

        const textContent = itemRef.current?.textContent ?? prevTextContentRef.current;
        if (textContent) {
          // Cache the text content so we have a reference to it when the item is unmounted.
          prevTextContentRef.current = textContent;
        }
        return textContent;
      };

      prevTextContentRef.current = getFilterText();
      setHasRegistered(true);
      return registerItem(itemId, { getText: getFilterText, keywords });
    }, [itemId, registerItem, label, keywords, domTextVersion]);

    // Rendered children can change without `label` changing. Republish so the active query is
    // re-applied to the new text instead of leaving the item matched against its previous text.
    useIsoLayoutEffect(() => {
      if (label != null) {
        return;
      }

      const textContent = itemRef.current?.textContent;
      if (textContent && textContent !== prevTextContentRef.current) {
        prevTextContentRef.current = textContent;
        setDomTextVersion((version) => version + 1);
      }
    }, [label, componentProps.children]);

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
  /**
   * Additional terms the item matches on, beyond its label.
   */
  keywords?: readonly string[] | undefined;
}

export namespace FilterDropdownItem {
  export type Props = FilterDropdownItemProps;
}
