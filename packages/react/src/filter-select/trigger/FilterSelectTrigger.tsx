'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { FilterDropdown } from '../../filter-dropdown';
import { SelectTrigger, type SelectTriggerProps } from '../../select/trigger/SelectTrigger';
import { useSelectRootContext } from '../../select/root/SelectRootContext';
import { selectors } from '../../select/store';

export const FilterSelectTrigger = React.forwardRef(function FilterSelectTrigger(
  props: FilterSelectTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { id, ...selectProps } = props;
  const { store } = useSelectRootContext();
  const rootId = useStore(store, selectors.id);
  const triggerId = id ?? rootId;

  return (
    <FilterDropdown.Trigger
      id={triggerId}
      render={<SelectTrigger {...selectProps} ref={forwardedRef} />}
    />
  );
});

export interface FilterSelectTriggerProps extends SelectTriggerProps {}

export namespace FilterSelectTrigger {
  export type Props = FilterSelectTriggerProps;
  export type State = SelectTrigger.State;
}
