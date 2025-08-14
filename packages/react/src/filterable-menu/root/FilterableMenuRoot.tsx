'use client';
import * as React from 'react';
import { ComboboxRoot } from '../../combobox/root/ComboboxRoot';
import { ComboboxDefaultAnchorContext } from '../../combobox/positioner/ComboboxDefaultAnchorContext';

/**
 * Groups all parts of the filterable menu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Filterable Menu](https://base-ui.com/react/components/filterable-menu)
 */
export function FilterableMenuRoot<Item = any>(
  props: FilterableMenuRoot.Props<Item>,
): React.JSX.Element {
  return (
    <ComboboxDefaultAnchorContext.Provider value="trigger">
      <ComboboxRoot {...props} selectionMode="none" fillInputOnItemPress={false} />
    </ComboboxDefaultAnchorContext.Provider>
  );
}

export namespace FilterableMenuRoot {
  export interface Props<Item = any>
    extends Omit<
      ComboboxRoot.Props<Item, 'none'>,
      | 'selectionMode'
      | 'selectedValue'
      | 'defaultSelectedValue'
      | 'fillInputOnItemPress'
      | 'itemToString'
      | 'itemToValue'
      | 'openOnInputClick'
    > {
    /**
     * Whether the combobox popup opens when clicking the input.
     * @default false
     */
    openOnInputClick?: boolean;
  }
}
