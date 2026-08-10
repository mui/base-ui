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
export function FilterableMenuRoot<Payload>(
  props: FilterableMenuRoot.Props<Payload>,
): React.JSX.Element {
  return (
    <MenuFilterIntegrationContext.Provider value={filterIntegration}>
      <MenuRoot<Payload> {...props} />
    </MenuFilterIntegrationContext.Provider>
  );
}

export namespace FilterableMenuRoot {
  export type Props<Payload = unknown> = MenuRoot.Props<Payload>;
  export type Actions = MenuRoot.Actions;
  export type State = MenuRoot.State;
  export type ChangeEventReason = MenuRoot.ChangeEventReason;
  export type ChangeEventDetails = MenuRoot.ChangeEventDetails;
  export type InputValueChangeEventReason = MenuRoot.InputValueChangeEventReason;
  export type InputValueChangeEventDetails = MenuRoot.InputValueChangeEventDetails;
}
