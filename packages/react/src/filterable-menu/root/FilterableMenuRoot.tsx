'use client';
import * as React from 'react';
import { ComboboxRootInternal } from '../../combobox/root/ComboboxRootInternal';

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
    <ComboboxRootInternal
      {...(props as any)}
      selectionMode="none"
      fillInputOnItemPress={false}
      openOnInputClick={false}
      clearInputOnCloseComplete
      modal={props.modal ?? true}
    />
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
      | 'itemToLabel'
      | 'itemToValue'
      | 'openOnInputClick'
      | 'clearInputOnCloseComplete'
      | 'name'
      | 'required'
      | 'inputRef'
    > {}
}
