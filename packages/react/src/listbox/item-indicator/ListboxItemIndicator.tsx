'use client';
import { createItemIndicator } from '../../utils/ItemIndicator';
import type { ItemIndicatorState, ItemIndicatorProps } from '../../utils/ItemIndicator';
import { useListboxItemContext } from '../item/ListboxItemContext';

/**
 * Indicates whether the listbox item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxItemIndicator = createItemIndicator(
  () => useListboxItemContext().selected,
);

export type ListboxItemIndicatorState = ItemIndicatorState;
export type ListboxItemIndicatorProps = ItemIndicatorProps;

export namespace ListboxItemIndicator {
  export type State = ListboxItemIndicatorState;
  export type Props = ListboxItemIndicatorProps;
}
