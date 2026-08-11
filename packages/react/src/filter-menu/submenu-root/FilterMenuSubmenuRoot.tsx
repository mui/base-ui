'use client';
import * as React from 'react';
import { MenuSubmenuRoot } from '../../menu/submenu-root/MenuSubmenuRoot';
import { MenuFilterIntegrationContext } from '../../menu/root/MenuFilterIntegrationContext';
import { filterIntegration } from '../filterIntegration';

/**
 * Groups all parts of a filterable submenu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function FilterMenuSubmenuRoot(props: FilterMenuSubmenuRoot.Props): React.JSX.Element {
  if (props.items === undefined) {
    throw new Error(
      'Base UI: <FilterMenu.SubmenuRoot> requires the `items` prop. Filtering narrows this data ' +
        'before the list renders, so without it nothing can be filtered. Pass the entries to ' +
        '`items` and render them with a function as the children of <FilterMenu.List>. ' +
        'See https://base-ui.com/react/components/menu#filterable',
    );
  }

  return (
    <MenuFilterIntegrationContext.Provider value={filterIntegration}>
      <MenuSubmenuRoot {...props} />
    </MenuFilterIntegrationContext.Provider>
  );
}

export namespace FilterMenuSubmenuRoot {
  export type Props = MenuSubmenuRoot.Props & {
    /**
     * The entries to render the list from and filter. Render them with a function as the
     * `children` of `FilterMenu.List`.
     */
    items: readonly any[];
  };
}
