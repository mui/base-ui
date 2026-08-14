'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useStore } from '@base-ui/utils/store';
import {
  useFilterDropdownRootContext,
  type FilterDropdownRootContext,
} from '../root/FilterDropdownRootContext';
import { useFilterDropdownGroupContext } from '../group/FilterDropdownGroupContext';
import { DETACHED_OWNER, selectors } from '../store';

export interface UseFilterDropdownItemParameters {
  /**
   * A text representation of the item used for filtering. Falls back to the rendered text.
   */
  label?: string | undefined;
  /**
   * Additional terms the item matches on, beyond its label.
   */
  keywords?: readonly string[] | undefined;
  /**
   * Value handed to a custom filter, so it matches against the consumer's own item shape.
   */
  filterValue?: unknown;
  /**
   * The item's children, watched so a changed label re-registers against the active query.
   */
  children?: React.ReactNode;
  /**
   * The dropdown that owns this item, when it isn't the nearest one. A filterable submenu's
   * trigger sits inside its own submenu's root but belongs to the enclosing list.
   */
  context?: FilterDropdownRootContext | null | undefined;
}

export interface UseFilterDropdownItemReturnValue {
  /**
   * Whether the item matches the current query and should render.
   */
  visible: boolean;
  /**
   * Ref for the rendered element, used to read its text when no `label` is given.
   */
  ref: React.RefObject<HTMLElement | null>;
}

/**
 * Registers an item with the enclosing filter root and reports whether the query keeps it.
 *
 * The item renders once before it is registered so its rendered text can be read and cached: a
 * popup can open with a query that already excludes the item, and a hidden item has no text left
 * to match against.
 *
 * @internal
 */
export function useFilterDropdownItem(
  params: UseFilterDropdownItemParameters,
): UseFilterDropdownItemReturnValue {
  const { label, keywords, filterValue, children, context } = params;
  const nearestContext = useFilterDropdownRootContext(context !== undefined);
  const owner = context === undefined ? nearestContext : context;
  const { registerItem, store } = owner ?? DETACHED_OWNER;
  const groupContext = useFilterDropdownGroupContext();
  const registerGroupItem = groupContext?.registerItem;

  const itemId = useRefWithInit(() => Symbol('filter-dropdown-item')).current;
  const ref = React.useRef<HTMLElement | null>(null);
  const previousTextRef = React.useRef<string | undefined>(undefined);
  const [registered, setRegistered] = React.useState(false);
  const matched = useStore(store, selectors.isItemVisible, itemId);

  const register = React.useCallback(() => {
    const getText = () => {
      // Return the label before touching the DOM; reading `textContent` is only a fallback.
      if (label != null) {
        return label;
      }

      const textContent = ref.current?.textContent ?? previousTextRef.current;
      if (textContent) {
        // Cache it so the text survives the item being filtered out and unmounted.
        previousTextRef.current = textContent;
      }
      return textContent;
    };

    previousTextRef.current = getText();
    setRegistered(true);
    return registerItem(itemId, { getText, keywords, filterValue });
  }, [itemId, registerItem, label, keywords, filterValue]);

  useIsoLayoutEffect(register, [register]);

  useIsoLayoutEffect(() => registerGroupItem?.(itemId), [registerGroupItem, itemId]);

  // Re-register when the rendered children change so the active query runs against the new text.
  useIsoLayoutEffect(() => {
    if (label != null) {
      return;
    }

    const textContent = ref.current?.textContent;
    if (textContent && textContent !== previousTextRef.current) {
      previousTextRef.current = textContent;
      void register();
    }
  }, [label, register, children]);

  return { visible: !registered || matched, ref };
}
