'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useStore } from '@base-ui/utils/store';
import {
  useFilterDropdownItemContext,
  type FilterDropdownItemContext,
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
  context?: FilterDropdownItemContext | null | undefined;
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
  const { label, keywords, retainGroup = false, children, context } = params;

  const nearestContext = useFilterDropdownItemContext(context !== undefined);
  const groupContext = useFilterDropdownGroupContext();

  const owner = context === undefined ? nearestContext : context;
  const { registerItem, store } = owner ?? DETACHED_OWNER;
  const registerGroupItem = groupContext?.registerItem;

  const itemId = useRefWithInit(() => Symbol('filter-dropdown-item')).current;
  const ref = React.useRef<HTMLElement | null>(null);
  const previousTextRef = React.useRef<string | undefined>(undefined);
  const previousKeywordsKeyRef = React.useRef(keywords?.join('\u0000'));
  const matched = useStore(store, selectors.isItemVisible, itemId);
  // An initial item is visible before registration (`visibleItemIds` is null), so start
  // registered and skip the mount re-render. A late item under an active filter starts
  // unregistered and renders once so its DOM text can be captured.
  const [registered, setRegistered] = React.useState(matched);

  // Read through refs so `register` stays stable. An inline `keywords` array is a fresh reference
  // on every render of the consumer's tree, which would otherwise re-register every item.
  const childrenRef = useValueAsRef(children);
  const keywordsRef = useValueAsRef(keywords);
  const keywordsKey = keywords?.join('\u0000');

  const resolveText = React.useCallback(() => {
    if (label != null) {
      return label;
    }
    // A filtered-out item has no DOM node left, so fall back to its children.
    return ref.current?.textContent ?? childrenText(childrenRef.current);
  }, [label, childrenRef]);

  const register = React.useCallback(() => {
    const text = resolveText();
    if (text) {
      previousTextRef.current = text;
    }
    return registerItem(itemId, {
      getText: () => previousTextRef.current,
      get keywords() {
        return keywordsRef.current;
      },
    });
  }, [itemId, registerItem, resolveText, keywordsRef]);

  useIsoLayoutEffect(() => {
    const unregister = register();
    setRegistered(true);
    return unregister;
  }, [register]);

  useIsoLayoutEffect(
    () => registerGroupItem?.(itemId, retainGroup),
    [registerGroupItem, itemId, retainGroup],
  );

  // Re-register when filterable item data changes, so the active query runs again.
  useIsoLayoutEffect(() => {
    const text = resolveText();
    const keywordsChanged = keywordsKey !== previousKeywordsKeyRef.current;
    if (text !== previousTextRef.current || keywordsChanged) {
      // Keep the last rendered text when the item is filtered out. A custom child component
      // cannot be inspected once its host element is unmounted.
      if (text || ref.current !== null || label != null) {
        previousTextRef.current = text;
      }
      previousKeywordsKeyRef.current = keywordsKey;
      void register();
    }
  }, [register, resolveText, children, keywordsKey, label]);

  return { visible: !registered || matched, ref };
}
