'use client';
import * as React from 'react';
import { SelectRoot } from '../../select/root/SelectRoot';
import { SelectFilterIntegrationContext } from '../../select/root/SelectFilterIntegrationContext';
import { filterIntegration } from '../filterIntegration';

/**
 * Groups all parts of a filterable select.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function FilterSelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: FilterSelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  if (props.items === undefined) {
    throw new Error(
      'Base UI: <FilterSelect.Root> requires the `items` prop. Filtering narrows this data ' +
        'before the list renders, so without it nothing can be filtered. Pass the entries to ' +
        '`items` and render them with a function as the children of <FilterSelect.List>. ' +
        'See https://base-ui.com/react/components/select#filterable',
    );
  }

  return (
    <SelectFilterIntegrationContext.Provider value={filterIntegration}>
      <SelectRoot<Value, Multiple> {...props} />
    </SelectFilterIntegrationContext.Provider>
  );
}

export namespace FilterSelectRoot {
  export type Props<Value = any, Multiple extends boolean | undefined = false> = SelectRoot.Props<
    Value,
    Multiple
  > & {
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
