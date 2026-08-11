'use client';
import * as React from 'react';
import { MenuRoot } from '../../menu/root/MenuRoot';
import { MenuFilterIntegrationContext } from '../../menu/root/MenuFilterIntegrationContext';
import { filterIntegration } from '../filterIntegration';

/**
 * Groups all parts of a filterable menu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export function FilterMenuRoot<Payload>(props: FilterMenuRoot.Props<Payload>): React.JSX.Element {
  if (props.items === undefined) {
    throw new Error(
      'Base UI: <FilterMenu.Root> requires the `items` prop. Filtering narrows this data before ' +
        'the list renders, so without it nothing can be filtered. Pass the entries to `items` ' +
        'and render them with a function as the children of <FilterMenu.List>. ' +
        'See https://base-ui.com/react/components/menu#filterable',
    );
  }

  return (
    <MenuFilterIntegrationContext.Provider value={filterIntegration}>
      <MenuRoot<Payload> {...props} />
    </MenuFilterIntegrationContext.Provider>
  );
}

export namespace FilterMenuRoot {
  export type Props<Payload = unknown> = MenuRoot.Props<Payload> & {
    /**
     * The entries to render the list from and filter. Render them with a function as the
     * `children` of `FilterMenu.List`.
     */
    items: readonly any[];
  };
  export type Actions = MenuRoot.Actions;
  export type State = MenuRoot.State;
  export type ChangeEventReason = MenuRoot.ChangeEventReason;
  export type ChangeEventDetails = MenuRoot.ChangeEventDetails;
  export type InputValueChangeEventReason = MenuRoot.InputValueChangeEventReason;
  export type InputValueChangeEventDetails = MenuRoot.InputValueChangeEventDetails;
}
