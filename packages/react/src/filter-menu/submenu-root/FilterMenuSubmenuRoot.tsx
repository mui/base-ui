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
  return (
    <MenuFilterIntegrationContext.Provider value={filterIntegration}>
      <MenuSubmenuRoot {...props} />
    </MenuFilterIntegrationContext.Provider>
  );
}

export namespace FilterMenuSubmenuRoot {
  export type Props = MenuSubmenuRoot.Props;
}
