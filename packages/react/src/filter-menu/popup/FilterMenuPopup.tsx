'use client';
import * as React from 'react';
import { FilterDropdown } from '../../filter-dropdown';
import { MenuPopup, type MenuPopupProps } from '../../menu/popup/MenuPopup';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';

export const FilterMenuPopup = React.forwardRef(function FilterMenuPopup(
  props: FilterMenuPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id, ...menuProps } = props;
  const { floatingId, store } = useMenuRootContext();
  const activeTriggerId = store.useState('activeTriggerId');
  const popupId = id ?? floatingId;

  return (
    <FilterDropdown.Popup
      id={popupId}
      aria-labelledby={activeTriggerId ?? undefined}
      render={<MenuPopup {...menuProps} id={popupId} ref={forwardedRef} role="dialog" />}
    />
  );
});

export interface FilterMenuPopupProps extends MenuPopupProps {}

export namespace FilterMenuPopup {
  export type Props = FilterMenuPopupProps;
  export type State = MenuPopup.State;
}
