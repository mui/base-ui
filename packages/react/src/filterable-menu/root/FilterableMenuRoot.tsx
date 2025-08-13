'use client';
import * as React from 'react';
import { ComboboxRoot } from '../../combobox/root/ComboboxRoot';

/**
 * Groups all parts of the filterable menu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Filterable Menu](https://base-ui.com/react/components/filterable-menu)
 */
export function FilterableMenuRoot<Item = any>(
  props: Omit<
    ComboboxRoot.Props<Item, 'none'>,
    | 'selectionMode'
    | 'selectedValue'
    | 'defaultSelectedValue'
    | 'fillInputOnItemPress'
    | 'itemToString'
    | 'itemToValue'
  >,
): React.JSX.Element {
  return <ComboboxRoot {...props} selectionMode="none" fillInputOnItemPress={false} />;
}
