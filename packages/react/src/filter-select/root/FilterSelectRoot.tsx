'use client';
import * as React from 'react';
import { SelectRoot } from '../../select/root/SelectRoot';
import {
  SelectFilterIntegrationContext,
  type SelectFilterProps,
} from '../../select/root/SelectFilterIntegrationContext';
import { filterIntegration } from '../filterIntegration';

/**
 * Groups all parts of a filterable select.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Filter Select](https://base-ui.com/react/components/filter-select)
 */
export function FilterSelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: FilterSelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const { filter, inputValue, defaultInputValue, onInputValueChange, ...selectProps } = props;

  if (selectProps.items === undefined) {
    throw new Error(
      'Base UI: <FilterSelect.Root> requires the `items` prop. Filtering narrows this data ' +
        'before the list renders, so without it nothing can be filtered. Pass the entries to ' +
        '`items` and render them with a function as the children of <FilterSelect.List>. ' +
        'See https://base-ui.com/react/components/filter-select',
    );
  }

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
    <SelectFilterIntegrationContext.Provider value={config}>
      <SelectRoot<Value, Multiple> {...selectProps} />
    </SelectFilterIntegrationContext.Provider>
  );
}

export namespace FilterSelectRoot {
  // Not a discriminated union on `filter`: `Omit`, `Pick`, and object rest all collapse a union
  // into one object type with widened members, which then matches no branch, so a typed wrapper
  // like `interface MyProps extends Omit<FilterSelect.Root.Props, 'children'>` would not compile.
  export type Props<Value = any, Multiple extends boolean | undefined = false> = SelectRoot.Props<
    Value,
    Multiple
  > &
    SelectFilterProps & {
      /**
       * The entries to render the list from and filter. Render them with a function as the
       * `children` of `FilterSelect.List`.
       */
      items: NonNullable<SelectRoot.Props<Value, Multiple>['items']>;
    };
  export type Actions = SelectRoot.Actions;
  export type State = SelectRoot.State;
  export type ChangeEventReason = SelectRoot.ChangeEventReason;
  export type ChangeEventDetails = SelectRoot.ChangeEventDetails;
  export type InputValueChangeEventReason = SelectRoot.InputValueChangeEventReason;
  export type InputValueChangeEventDetails = SelectRoot.InputValueChangeEventDetails;
}
