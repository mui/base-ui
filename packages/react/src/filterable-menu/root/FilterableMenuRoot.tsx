'use client';
import * as React from 'react';
import { ComboboxRootInternal } from '../../combobox/root/ComboboxRootInternal';
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
  const { modal = true, ...rest } = props;

  return (
    <ComboboxDefaultAnchorContext.Provider value="trigger">
      <ComboboxRootInternal
        {...rest}
        selectionMode="none"
        fillInputOnItemPress={false}
        openOnInputClick={false}
        clearInputOnCloseComplete
        modal={modal}
      />
    </ComboboxDefaultAnchorContext.Provider>
  );
}

export namespace FilterableMenuRoot {
  export interface Props<Item = any>
    extends Omit<
      ComboboxRootInternal.Props<Item, 'none'>,
      | 'selectionMode'
      | 'selectedValue'
      | 'defaultSelectedValue'
      | 'fillInputOnItemPress'
      | 'itemToString'
      | 'itemToValue'
      | 'openOnInputClick'
      | 'clearInputOnCloseComplete'
      | 'name'
      | 'required'
      | 'inputRef'
    > {}
}
