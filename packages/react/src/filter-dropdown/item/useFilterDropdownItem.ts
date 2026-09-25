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
  const { label, retainGroup = false, children, context } = params;

  const nearestContext = useFilterDropdownItemContext(context !== undefined);
  const groupContext = useFilterDropdownGroupContext();

  const owner = context === undefined ? nearestContext : context;
  const { registerItem, store } = owner ?? DETACHED_OWNER;
  const registerGroupItem = groupContext?.registerItem;

  const itemId = useRefWithInit(() => Symbol('filter-dropdown-item')).current;
  const ref = React.useRef<HTMLElement | null>(null);
  const previousTextRef = React.useRef<string | undefined>(undefined);

  const matched = useStore(store, selectors.isItemVisible, itemId);

  // An initial item is visible before registration (`visibleItemIds` is null), so start
  // registered and skip the mount re-render. A late item under an active filter starts
  // unregistered and renders once so its DOM text can be captured.
  const [registered, setRegistered] = React.useState(matched);

  // Read through a ref so `register` stays stable while the children change identity.
  const childrenRef = useValueAsRef(children);

  // What the children last read as, to tell whether they changed while the item rendered no text.
  const childrenTextRef = React.useRef<string | undefined>(undefined);

  const resolveText = React.useCallback(() => {
    if (label != null) {
      return label;
    }
    const fromChildren = childrenText(childrenRef.current);
    const previousChildrenText = childrenTextRef.current;
    childrenTextRef.current = fromChildren;
    if (ref.current !== null) {
      return ref.current.textContent ?? '';
    }
    // A filtered-out item has no DOM node left. Its children are only a stand-in for the text it
    // renders, which can differ (a translation component, for example), so the cached text wins
    // unless the children changed.
    if (previousTextRef.current !== undefined && fromChildren === previousChildrenText) {
      return previousTextRef.current;
    }
    return fromChildren;
  }, [label, childrenRef]);

  const register = React.useCallback(
    (resolvedText?: string) => {
      const text = resolvedText ?? resolveText();
      if (text) {
        previousTextRef.current = text;
      }
      return registerItem(itemId, {
        getText: () => previousTextRef.current,
      });
    },
    [itemId, registerItem, resolveText],
  );

  useIsoLayoutEffect(() => {
    const unregister = register();
    setRegistered(true);
    return unregister;
  }, [register]);

  useIsoLayoutEffect(
    () => registerGroupItem?.(itemId, retainGroup),
    [registerGroupItem, itemId, retainGroup],
  );

  // Re-register when the item's text changes, so the active query runs again.
  useIsoLayoutEffect(() => {
    const text = resolveText();
    if (text !== previousTextRef.current) {
      previousTextRef.current = text;
      void register(text);
    }
  }, [register, resolveText, children, label]);

  return { visible: !registered || matched, ref };
}
