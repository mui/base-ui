'use client';
import * as React from 'react';
import { MenuRootContext } from '../root/MenuRootContext';
import type { HTMLProps } from '../../internals/types';
import type { FilteredMenuPopup } from './FilteredMenuPopup';
import type { FilteredMenuGroup } from './FilteredMenuGroup';
import type { FilteredMenuRadioGroup } from './FilteredMenuRadioGroup';

export interface MenuFilterItemParams {
  label: string | undefined;
  keywords: readonly string[] | undefined;
  children: React.ReactNode;
}

export interface MenuFilterItemResult {
  /** Whether the item matches the query. A hidden item renders nothing. */
  visible: boolean;
  /** Registers the element with the filter. */
  ref: React.Ref<HTMLElement> | null;
  /** Props the filter needs on the element, merged under the consumer's. */
  props?: HTMLProps | undefined;
}

/**
 * The filter implementation that a filterable root hands to the parts below it. Only the roots
 * `Menu.FilterProvider` renders import it, so a plain menu never bundles it. Parts whose whole structure differs are swapped as components; parts that only
 * register with the filter call an injected hook, so a menu that never renders them doesn't
 * bundle a second implementation.
 */
export interface MenuFilterImpl {
  Popup: typeof FilteredMenuPopup;
  Group: typeof FilteredMenuGroup;
  RadioGroup: typeof FilteredMenuRadioGroup;
  /** Registers an item with the filter and reports whether it matches the query. */
  useItem: (params: MenuFilterItemParams) => MenuFilterItemResult;
  /** Like `useItem` for a submenu trigger, which is an item of the parent list. */
  useSubmenuTrigger: (params: MenuFilterItemParams) => MenuFilterItemResult;
}

/** Static below a filter root: the implementation never changes, so subscribers never re-render. */
export const MenuFilterImplContext = React.createContext<MenuFilterImpl | null>(null);

export type MenuFilterPartScope =
  /** The part belongs to the nearest root. */
  | 'root'
  /** The part is an item of the parent list but renders inside its own submenu root. */
  | 'submenu-trigger';

/**
 * The filter implementation when the menu this part belongs to is filterable, otherwise `null`.
 * `virtualFocus` marks a filter root; a plain `Menu.Root` never sets it. The result is fixed for
 * a mounted part: a filter root can't appear above it without remounting it.
 */
export function useMenuFilterImpl(scope: MenuFilterPartScope = 'root'): MenuFilterImpl | null {
  const impl = React.useContext(MenuFilterImplContext);
  const root = React.useContext(MenuRootContext);
  if (impl === null || root === undefined) {
    return null;
  }

  const filterable =
    scope === 'submenu-trigger' ? root.virtualFocus || root.parentVirtualFocus : root.virtualFocus;
  return filterable ? impl : null;
}

const UNFILTERED: MenuFilterItemResult = { visible: true, ref: null };

/** The hook a plain menu's items call in place of the injected one. */
export function useUnfilteredItem(): MenuFilterItemResult {
  return UNFILTERED;
}
