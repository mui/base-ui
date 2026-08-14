'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { FilterDropdown } from '../../filter-dropdown';
import { SelectPopup, type SelectPopupProps } from '../../select/popup/SelectPopup';
import { useSelectRootContext } from '../../select/root/SelectRootContext';
import { selectors } from '../../select/store';

export const FilterSelectPopup = React.forwardRef(function FilterSelectPopup(
  props: FilterSelectPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { store } = useSelectRootContext();
  const rootId = useStore(store, selectors.id);
  const id = props.id ?? `${rootId}-popup`;

  return (
    <FilterDropdown.Popup id={id} render={<SelectPopup {...props} id={id} ref={forwardedRef} />} />
  );
});

export interface FilterSelectPopupProps extends SelectPopupProps {}

export namespace FilterSelectPopup {
  export type Props = FilterSelectPopupProps;
  export type State = SelectPopup.State;
}
