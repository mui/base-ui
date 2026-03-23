'use client';
import { createItemIndicator } from '../../utils/ItemIndicator';
import type { ItemIndicatorState, ItemIndicatorProps } from '../../utils/ItemIndicator';
import { useSelectItemContext } from '../item/SelectItemContext';

/**
 * Indicates whether the select item is selected.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectItemIndicator = createItemIndicator(() => useSelectItemContext().selected);

export type SelectItemIndicatorState = ItemIndicatorState;
export type SelectItemIndicatorProps = ItemIndicatorProps;

export namespace SelectItemIndicator {
  export type State = SelectItemIndicatorState;
  export type Props = SelectItemIndicatorProps;
}
