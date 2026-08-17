'use client';
import * as React from 'react';
import { FilterDropdownPopup } from '../../filter-dropdown/popup/FilterDropdownPopup';
import { MenuPopup, type MenuPopupProps } from '../../menu/popup/MenuPopup';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';

export const FilterMenuPopup = React.forwardRef(function FilterMenuPopup(
  props: FilterMenuPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id, ...menuProps } = props;
  const { floatingId, store } = useMenuRootContext();
  const activeTriggerId = store.useState('activeTriggerId');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const popupId = id ?? floatingId;

  return (
    <FilterDropdownPopup
      id={popupId}
      aria-labelledby={activeTriggerElement?.id ?? activeTriggerId ?? undefined}
      // The consumer's props and ref go to the inner popup only, so each handler runs once.
      render={<MenuPopup {...menuProps} id={popupId} ref={forwardedRef} role="dialog" />}
    />
  );
});

export interface FilterMenuPopupProps extends MenuPopupProps {}

export namespace FilterMenuPopup {
  export type Props = FilterMenuPopupProps;
  export type State = MenuPopup.State;
}
