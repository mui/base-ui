'use client';
import * as React from 'react';
import { FilterDropdownPopup } from '../../filter-dropdown/popup/FilterDropdownPopup';
import { MenuPopupPlain, type MenuPopupProps, type MenuPopupState } from '../popup/MenuPopup';
import { useMenuRootContext } from '../root/MenuRootContext';
import { resolveMenuPopupLabel } from '../popup/resolveMenuPopupLabel';

/**
 * A container for the filter input and item list.
 * Renders a `<div>` element with a `dialog` role.
 */
export const FilteredMenuPopup = React.forwardRef(function FilteredMenuPopup(
  props: FilteredMenuPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id, ...menuProps } = props;

  const { defaultFloatingId, store } = useMenuRootContext();
  const activeTriggerId = store.useState('activeTriggerId');
  const activeTriggerElement = store.useState('activeTriggerElement');

  const popupId = id ?? defaultFloatingId;
  const { ariaLabel, ariaLabelledBy } = resolveMenuPopupLabel(
    menuProps,
    activeTriggerElement,
    activeTriggerId,
  );

  return (
    <FilterDropdownPopup
      id={popupId}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      // The consumer's props and ref go to the inner popup only, so each handler runs once.
      render={<MenuPopupPlain {...menuProps} id={id} ref={forwardedRef} role="dialog" />}
    />
  );
});

export interface FilteredMenuPopupProps extends MenuPopupProps {}
export interface FilteredMenuPopupState extends MenuPopupState {}

export namespace FilteredMenuPopup {
  export type Props = FilteredMenuPopupProps;
  export type State = FilteredMenuPopupState;
}
