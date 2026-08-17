'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStore } from '@base-ui/utils/store';
import {
  useFilterDropdownRootContext,
  type FilterDropdownRootContext,
} from '../root/FilterDropdownRootContext';
import { useFilterDropdownGroupContext } from '../group/FilterDropdownGroupContext';
import { DETACHED_OWNER, selectors } from '../store';

/** Text of the rendered children, for when the element is filtered out and has no DOM node. */
function childrenText(children: React.ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(childrenText).join('');
  }
  if (React.isValidElement(children)) {
    return childrenText((children.props as { children?: React.ReactNode }).children);
  }
  return '';
}

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
   * Keeps the nearest group visible while this filtered-out item must remain mounted.
   */
  retainGroup?: boolean | undefined;
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
  const { label, keywords, filterValue, retainGroup = false, children, context } = params;
  const nearestContext = useFilterDropdownRootContext(context !== undefined);
  const owner = context === undefined ? nearestContext : context;
  const { registerItem, store } = owner ?? DETACHED_OWNER;
  const groupContext = useFilterDropdownGroupContext();
  const registerGroupItem = groupContext?.registerItem;

  const itemId = useRefWithInit(() => Symbol('filter-dropdown-item')).current;
  const ref = React.useRef<HTMLElement | null>(null);
  const previousTextRef = React.useRef<string | undefined>(undefined);
  const previousFilterValueRef = React.useRef(filterValue);
  const previousKeywordsKeyRef = React.useRef(keywords?.join('\u0000'));
  const [registered, setRegistered] = React.useState(false);
  const matched = useStore(store, selectors.isItemVisible, itemId);

  // Read through refs so `register` stays stable. An inline `keywords` array is a fresh reference
  // on every render of the consumer's tree, which would otherwise re-register every item.
  const childrenRef = useValueAsRef(children);
  const keywordsRef = useValueAsRef(keywords);
  const filterValueRef = useValueAsRef(filterValue);
  const keywordsKey = keywords?.join('\u0000');

  const resolveText = React.useCallback(() => {
    if (label != null) {
      return label;
    }
    // A filtered-out item has no DOM node left, so fall back to its children.
    return ref.current?.textContent ?? childrenText(childrenRef.current);
  }, [label, childrenRef]);

  const register = React.useCallback(() => {
    const getText = () => {
      const text = resolveText();
      if (text) {
        previousTextRef.current = text;
      }
      return text || previousTextRef.current;
    };

    previousTextRef.current = getText();
    setRegistered(true);
    return registerItem(itemId, {
      getText,
      get keywords() {
        return keywordsRef.current;
      },
      get filterValue() {
        return filterValueRef.current;
      },
    });
  }, [itemId, registerItem, resolveText, keywordsRef, filterValueRef]);

  useIsoLayoutEffect(register, [register]);

  useIsoLayoutEffect(
    () => registerGroupItem?.(itemId, retainGroup),
    [registerGroupItem, itemId, retainGroup],
  );

  // Re-register when filterable item data changes, so the active query runs again.
  useIsoLayoutEffect(() => {
    const text = resolveText();
    const filterValueChanged = !Object.is(filterValue, previousFilterValueRef.current);
    const keywordsChanged = keywordsKey !== previousKeywordsKeyRef.current;
    if (text !== previousTextRef.current || filterValueChanged || keywordsChanged) {
      previousTextRef.current = text;
      previousFilterValueRef.current = filterValue;
      previousKeywordsKeyRef.current = keywordsKey;
      void register();
    }
  }, [register, resolveText, children, keywordsKey, filterValue]);

  return { visible: !registered || matched, ref };
}
