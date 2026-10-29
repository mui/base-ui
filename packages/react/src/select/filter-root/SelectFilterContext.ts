'use client';
import * as React from 'react';
import { EMPTY_OBJECT, NOOP } from '@base-ui/utils/empty';
import type { HTMLProps } from '../../internals/types';
import type { SelectFilterPopup } from './SelectFilterPopup';
import type { SelectFilterList } from './SelectFilterList';
import type { SelectFilterGroup } from './SelectFilterGroup';
import type { SelectFilterItem } from './SelectFilterItem';
import { SelectRootContext } from '../root/SelectRootContext';

/**
 * The filter implementation that the filterable root hands to the parts below it. Only the root
 * that `Select.FilterProvider` renders imports it, so a plain select never bundles it.
 */
export interface SelectFilterImpl {
  Popup: typeof SelectFilterPopup;
  List: typeof SelectFilterList;
  Group: typeof SelectFilterGroup;
  Item: typeof SelectFilterItem;
  /** The props the filter adds to the trigger. */
  useTriggerProps: (id: string | undefined, ariaLabelledBy: string | undefined) => HTMLProps;
}

/** Static below a filter root: the implementation never changes, so subscribers never re-render. */
export const SelectFilterImplContext = React.createContext<SelectFilterImpl | null>(null);

/** The filter implementation when the select is filterable, otherwise `null`. */
export function useSelectFilterImpl(): SelectFilterImpl | null {
  const impl = React.useContext(SelectFilterImplContext);
  // A plain select nested inside a filterable one keeps its own parts.
  return React.useContext(SelectRootContext)?.context.filterable ? impl : null;
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

/** The hook a plain select's trigger calls in place of the injected one. */
export function useUnfilteredTriggerProps(): HTMLProps {
  return EMPTY_OBJECT;
}

export interface SelectFilterNavigationContext {
  /** Re-reads the highlighted option once the list's items settle. */
  syncActiveItem: () => void;
  /** The number of filtered items when the list is virtualized, otherwise `null`. */
  virtualizedCount: number | null;
  /** The position of a value among the filtered items of a virtualized list, or `-1`. */
  getVirtualIndex: (value: unknown) => number;
  /** Registers a mounted option of a virtualized list at its index among the filtered items. */
  registerVirtualItem: (index: number, element: HTMLElement | null) => () => void;
  /** Rewrites the navigable list of a virtualized list from its mounted options. */
  syncVirtualList: () => void;
  /** Whether the trigger was last pressed by a screen reader. */
  virtualPressRef: React.RefObject<boolean>;
}

// The engine's own context check fires first when a part renders outside the provider.
export const SelectFilterNavigationContext = React.createContext<SelectFilterNavigationContext>({
  syncActiveItem: NOOP,
  virtualizedCount: null,
  getVirtualIndex: () => -1,
  registerVirtualItem: () => NOOP,
  syncVirtualList: NOOP,
  virtualPressRef: { current: false },
});

export function useSelectFilterNavigationContext(): SelectFilterNavigationContext {
  return React.useContext(SelectFilterNavigationContext);
}
