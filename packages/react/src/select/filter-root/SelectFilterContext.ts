'use client';
import * as React from 'react';
import { EMPTY_OBJECT, NOOP } from '@base-ui/utils/empty';
import type { HTMLProps } from '../../internals/types';
import type { FilteredSelectPopup } from './FilteredSelectPopup';
import type { FilteredSelectList } from './FilteredSelectList';
import type { FilteredSelectGroup } from './FilteredSelectGroup';

export interface SelectFilterItemParams {
  label: string | undefined;
  index: number | undefined;
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
  /** The props the filter adds to the trigger. */
  useTriggerProps: () => HTMLProps;
}

/** Static below a filter root: the implementation never changes, so subscribers never re-render. */
export const SelectFilterImplContext = React.createContext<SelectFilterImpl | null>(null);

/** The filter implementation when the select is filterable, otherwise `null`. */
export function useSelectFilterImpl(): SelectFilterImpl | null {
  return React.useContext(SelectFilterImplContext);
}

/** Throws when a filter part renders in a select that isn't wrapped in `Select.FilterProvider`. */
export function useSelectFilterPart(part: string) {
  if (useSelectFilterImpl() === null) {
    throw new Error(
      `Base UI: <Select.${part}> must be placed in a select wrapped in <Select.FilterProvider>. ` +
        'It reads the filter query and the matching items from the provider, which a plain ' +
        'select does not have. Wrap the <Select.Root> it belongs to in <Select.FilterProvider>. ' +
        'See https://base-ui.com/react/components/select#filtering',
    );
  }
}

const UNFILTERED: SelectFilterItemResult = { visible: true, ref: null };

/** The hook a plain select's items call in place of the injected one. */
export function useUnfilteredItem(): SelectFilterItemResult {
  return UNFILTERED;
}

/** The hook a plain select's trigger calls in place of the injected one. */
export function useUnfilteredTriggerProps(): HTMLProps {
  return EMPTY_OBJECT;
}

export interface SelectFilterNavigationContext {
  /** The select's list navigation props for the input, which holds real focus. */
  navigationProps: HTMLProps;
  /** The id of the highlighted option, which the input points `aria-activedescendant` at. */
  activeItemId: string | undefined;
  /** Re-reads the highlighted option once the list's items settle. */
  syncActiveItem: () => void;
  /** The number of filtered items when the list is virtualized, otherwise `null`. */
  virtualizedCount: number | null;
  /** Registers a mounted option of a virtualized list at its index among the filtered items. */
  registerVirtualItem: (index: number, element: HTMLElement | null) => () => void;
  /** Rewrites the navigable list of a virtualized list from its mounted options. */
  syncVirtualList: () => void;
  /** Whether the trigger was last pressed by a screen reader. */
  virtualPressRef: React.RefObject<boolean>;
}

// The engine's own context check fires first when a part renders outside the provider.
export const SelectFilterNavigationContext = React.createContext<SelectFilterNavigationContext>({
  navigationProps: EMPTY_OBJECT,
  activeItemId: undefined,
  syncActiveItem: NOOP,
  virtualizedCount: null,
  registerVirtualItem: () => NOOP,
  syncVirtualList: NOOP,
  virtualPressRef: { current: false },
});

export function useSelectFilterNavigationContext(): SelectFilterNavigationContext {
  return React.useContext(SelectFilterNavigationContext);
}
