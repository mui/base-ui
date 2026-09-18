'use client';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { useBaseUiId } from '../../internals/useBaseUiId';
import type { SelectFilterItemParams, SelectFilterItemResult } from './SelectFilterContext';

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

/**
 * Registers an option with the filter. The input holds real focus, so the option is never in
 * the tab order, a press on it must not move focus, and it needs an id for the input's
 * `aria-activedescendant`.
 */
export function useFilteredSelectItem(params: SelectFilterItemParams): SelectFilterItemResult {
  const { visible, ref } = useFilterDropdownItem(params);
  const id = useBaseUiId();
  return { visible, ref, props: { id, tabIndex: -1, onMouseDown: preventDefault } };
}
