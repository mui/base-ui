'use client';
import * as React from 'react';
import { MenuSubmenuRoot } from '../../menu/submenu-root/MenuSubmenuRoot';
import type { MenuFilterProps } from '../../menu/root/MenuFilterIntegrationContext';
import { FilterMenuConfigProvider } from '../root/FilterMenuRoot';

/**
 * Groups all parts of a filterable submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export function FilterMenuSubmenuRoot(props: FilterMenuSubmenuRoot.Props): React.JSX.Element {
  const { filter, inputValue, defaultInputValue, onInputValueChange, ...menuProps } = props;

  return (
    <FilterMenuConfigProvider
      filter={filter}
      inputValue={inputValue}
      defaultInputValue={defaultInputValue}
      onInputValueChange={onInputValueChange}
    >
      <MenuSubmenuRoot {...menuProps} />
    </FilterMenuConfigProvider>
  );
}

export namespace FilterMenuSubmenuRoot {
  export type Props = MenuSubmenuRoot.Props & MenuFilterProps;
}
