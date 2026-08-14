'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownPopupContext } from '../popup/FilterDropdownPopupContext';
import { selectors } from '../store';
import { useFilterDropdownGroupContext } from '../group/FilterDropdownGroupContext';
import {
  useFilterDropdownRootContext,
  type FilterDropdownRootContext,
} from '../root/FilterDropdownRootContext';

/**
 * @internal
 */
export const FilterDropdownItem = React.memo(
  React.forwardRef(function FilterDropdownItem(
    componentProps: FilterDropdownItem.Props,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) {
    const {
      render,
      className,
      style,
      label,
      keywords,
      filterValue,
      itemId: itemIdProp,
      rootContext: rootContextProp,
      role = 'menuitem',
      ...elementProps
    } = componentProps;

    const nearestRootContext = useFilterDropdownRootContext();
    const rootContext = rootContextProp ?? nearestRootContext;
    const popupContext = useFilterDropdownPopupContext();
    const groupContext = useFilterDropdownGroupContext();
    const registerRootItem = rootContext.registerItem;
    const registerGroupItem = groupContext?.registerItem;

    const [hasRegistered, setHasRegistered] = React.useState(false);
    const itemId = useRefWithInit(() => Symbol('filter-dropdown-item')).current;
    const registeredItemId = itemIdProp ?? itemId;
    const ref = React.useRef<HTMLDivElement | null>(null);
    const prevTextContentRef = React.useRef<string | undefined>(undefined);
    const visible = useStore(popupContext.store, selectors.isItemVisible, registeredItemId);

    const registerItemConfig = React.useCallback(() => {
      const getText = () => {
        // Return the label before touching the DOM; reading `textContent` is only a fallback.
        if (label != null) {
          return label;
        }

        const textContent = ref.current?.textContent ?? prevTextContentRef.current;
        if (textContent) {
          // Cache the text content so we have a reference to it when the item is unmounted.
          prevTextContentRef.current = textContent;
        }
        return textContent;
      };

      prevTextContentRef.current = getText();
      setHasRegistered(true);
      return registerRootItem(registeredItemId, { getText, keywords, filterValue, ref });
    }, [registeredItemId, registerRootItem, label, keywords, filterValue, ref]);

    useIsoLayoutEffect(() => {
      return registerItemConfig();
    }, [registerItemConfig]);

    useIsoLayoutEffect(() => {
      return registerGroupItem?.(registeredItemId);
    }, [registerGroupItem, registeredItemId]);

    // Re-register when rendered children change so the active filter runs against the new text.
    useIsoLayoutEffect(() => {
      if (label != null) {
        return;
      }

      const textContent = ref.current?.textContent;
      if (textContent && textContent !== prevTextContentRef.current) {
        prevTextContentRef.current = textContent;
        void registerItemConfig();
      }
    }, [ref, label, registerItemConfig, componentProps.children]);

    const element = useRenderElement('div', componentProps, {
      enabled: !hasRegistered || visible,
      ref: [forwardedRef, ref],
      props: [rootContext.navigation.item, { role }, elementProps],
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
  /**
   * @ignore
   * Optional value passed to custom filter functions.
   */
  filterValue?: unknown;
  /**
   * The ARIA role applied to the item.
   *
   * @default 'menuitem'
   */
  role?: React.AriaRole | undefined;
  /**
   * @ignore
   */
  itemId?: symbol | undefined;
  /**
   * @ignore
   * Context of the dropdown that owns this item. Used when the nearest context belongs to a
   * nested dropdown, such as a submenu trigger rendered inside its own submenu's root.
   */
  rootContext?: FilterDropdownRootContext | undefined;
}

export namespace FilterDropdownItem {
  export type Props = FilterDropdownItemProps;
}
