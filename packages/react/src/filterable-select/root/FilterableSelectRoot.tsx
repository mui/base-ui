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
export function FilterableSelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: FilterableSelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  return (
    <SelectFilterIntegrationContext.Provider value={filterIntegration}>
      <SelectRoot<Value, Multiple> {...props} />
    </SelectFilterIntegrationContext.Provider>
  );
}

export namespace FilterableSelectRoot {
  export type Props<Value = any, Multiple extends boolean | undefined = false> = SelectRoot.Props<
    Value,
    Multiple
  >;
  export type Actions = SelectRoot.Actions;
  export type State = SelectRoot.State;
  export type ChangeEventReason = SelectRoot.ChangeEventReason;
  export type ChangeEventDetails = SelectRoot.ChangeEventDetails;
  export type InputValueChangeEventReason = SelectRoot.InputValueChangeEventReason;
  export type InputValueChangeEventDetails = SelectRoot.InputValueChangeEventDetails;
}
