'use client';
import * as React from 'react';
import { FilterDropdownPopup } from '../../filter-dropdown/popup/FilterDropdownPopup';
import { MenuPopup, type MenuPopupProps, type MenuPopupState } from '../../menu/popup/MenuPopup';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { resolveMenuPopupLabel } from '../../menu/popup/resolveMenuPopupLabel';

/**
 * A container for the filter input and item list.
 * Renders a `<div>` element with a `dialog` role.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuPopup = React.forwardRef(function FilterMenuPopup(
  props: FilterMenuPopup.Props,
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
      render={<MenuPopup {...menuProps} id={id} ref={forwardedRef} role="dialog" />}
    />
  );
});

export interface FilterMenuPopupProps extends MenuPopupProps {}
export interface FilterMenuPopupState extends MenuPopupState {}

export namespace FilterMenuPopup {
  export type Props = FilterMenuPopupProps;
  export type State = FilterMenuPopupState;
}
