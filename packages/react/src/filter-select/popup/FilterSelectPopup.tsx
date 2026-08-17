'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { FilterDropdownPopup } from '../../filter-dropdown/popup/FilterDropdownPopup';
import { SelectPopup, type SelectPopupProps } from '../../select/popup/SelectPopup';
import { useSelectRootContext } from '../../select/root/SelectRootContext';
import { selectors, suffixId } from '../../select/store';

export const FilterSelectPopup = React.forwardRef(function FilterSelectPopup(
  props: FilterSelectPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id: idProp, ...selectProps } = props;
  const { store } = useSelectRootContext();
  const rootId = useStore(store, selectors.id);
  const id = idProp ?? suffixId(rootId, 'popup');

  return (
    <FilterDropdownPopup
      id={id}
      render={<SelectPopup {...selectProps} id={id} ref={forwardedRef} />}
    />
  );
});

export interface FilterSelectPopupProps extends SelectPopupProps {}

export namespace FilterSelectPopup {
  export type Props = FilterSelectPopupProps;
  export type State = SelectPopup.State;
}
