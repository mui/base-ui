'use client';
import * as React from 'react';
import { MenuRoot } from '../../menu/root/MenuRoot';
import {
  MenuFilterIntegrationContext,
  type MenuFilterProps,
} from '../../menu/root/MenuFilterIntegrationContext';
import { filterIntegration } from '../filterIntegration';

/**
 * Feeds the filtering parts and the root's filter configuration to the menu through context, so
 * ordinary `Menu.Root` carries none of the filter-only props.
 * @internal
 */
export function FilterMenuConfigProvider(props: MenuFilterProps & { children: React.ReactNode }) {
  const { filter, inputValue, defaultInputValue, onInputValueChange, children } = props;

  const config = React.useMemo(
    () => ({
      integration: filterIntegration,
      filter,
      inputValue,
      defaultInputValue,
      onInputValueChange,
    }),
    [filter, inputValue, defaultInputValue, onInputValueChange],
  );

  return (
    <MenuFilterIntegrationContext.Provider value={config}>
      {children}
    </MenuFilterIntegrationContext.Provider>
  );
}

/**
 * Groups all parts of a filterable menu.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export function FilterMenuRoot<Payload>(props: FilterMenuRoot.Props<Payload>): React.JSX.Element {
  const { filter, inputValue, defaultInputValue, onInputValueChange, ...menuProps } = props;

  return (
    <FilterMenuConfigProvider
      filter={filter}
      inputValue={inputValue}
      defaultInputValue={defaultInputValue}
      onInputValueChange={onInputValueChange}
    >
      <MenuRoot<Payload> {...menuProps} />
    </FilterMenuConfigProvider>
  );
}

export namespace FilterMenuRoot {
  // Not a discriminated union on `filter`: `Omit`, `Pick`, and object rest all collapse a union
  // into one object type with widened members, which then matches no branch, so a typed wrapper
  // like `interface MyProps extends Omit<FilterMenu.Root.Props, 'children'>` would not compile.
  export type Props<Payload = unknown> = MenuRoot.Props<Payload> & MenuFilterProps;
  export type Actions = MenuRoot.Actions;
  export type State = MenuRoot.State;
  export type ChangeEventReason = MenuRoot.ChangeEventReason;
  export type ChangeEventDetails = MenuRoot.ChangeEventDetails;
  export type InputValueChangeEventReason = MenuRoot.InputValueChangeEventReason;
  export type InputValueChangeEventDetails = MenuRoot.InputValueChangeEventDetails;
}
