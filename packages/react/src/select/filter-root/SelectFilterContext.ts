'use client';
import * as React from 'react';
import type { HTMLProps } from '../../internals/types';
import type { FilteredSelectPopup } from './FilteredSelectPopup';
import type { FilteredSelectList } from './FilteredSelectList';
import type { FilteredSelectGroup } from './FilteredSelectGroup';

export interface SelectFilterItemParams {
  label: string | undefined;
  children: React.ReactNode;
}

export interface SelectFilterItemResult {
  /** Whether the item matches the query. A hidden item renders nothing. */
  visible: boolean;
  /** Registers the element with the filter. */
  ref: React.Ref<HTMLElement> | null;
  /** Props the filter needs on the element, merged under the consumer's. */
  props?: HTMLProps | undefined;
}

/**
 * The filter implementation that the filterable root hands to the parts below it. Only the root
 * `Select.FilterProvider` renders imports it, so a plain select never bundles it. Parts whose
 * structure differs are swapped as components; the item only registers with the filter, so it
 * calls an injected hook instead of bundling a second implementation.
 */
export interface SelectFilterImpl {
  Popup: typeof FilteredSelectPopup;
  List: typeof FilteredSelectList;
  Group: typeof FilteredSelectGroup;
  /** Registers an item with the filter and reports whether it matches the query. */
  useItem: (params: SelectFilterItemParams) => SelectFilterItemResult;
}

/** Static below a filter root: the implementation never changes, so subscribers never re-render. */
export const SelectFilterImplContext = React.createContext<SelectFilterImpl | null>(null);

/** The filter implementation when the select is filterable, otherwise `null`. */
export function useSelectFilterImpl(): SelectFilterImpl | null {
  return React.useContext(SelectFilterImplContext);
}

const UNFILTERED: SelectFilterItemResult = { visible: true, ref: null };

/** The hook a plain select's items call in place of the injected one. */
export function useUnfilteredItem(): SelectFilterItemResult {
  return UNFILTERED;
}
