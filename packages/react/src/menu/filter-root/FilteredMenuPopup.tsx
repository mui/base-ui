'use client';
import * as React from 'react';
import { visuallyHiddenInput } from '@base-ui/utils/visuallyHidden';
import { FilterDropdownPopup } from '../../filter-dropdown/popup/FilterDropdownPopup';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { MenuPopupPlain, type MenuPopupProps, type MenuPopupState } from '../popup/MenuPopup';
import { useMenuRootContext } from '../root/MenuRootContext';
import { resolveMenuPopupLabel } from '../popup/resolveMenuPopupLabel';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';

/**
 * A container for the filter input and item list.
 * Renders a `<div>` element with a `dialog` role.
 */
export const FilteredMenuPopup = React.forwardRef(function FilteredMenuPopup(
  props: FilteredMenuPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id, children, ...menuProps } = props;

  const { defaultFloatingId, store } = useMenuRootContext();
  const { closeLabel } = useFilterDropdownRootContext();
  const activeTriggerId = store.useState('activeTriggerId');
  const activeTriggerElement = store.useState('activeTriggerElement');
  const open = store.useState('open');
  const trapsFocus = store.useState('trapsFocus');

  const warnedRef = React.useRef(false);
  React.useEffect(() => {
    if (
      process.env.NODE_ENV !== 'production' &&
      open &&
      trapsFocus &&
      !closeLabel &&
      !warnedRef.current
    ) {
      warnedRef.current = true;
      console.warn(
        'Base UI: a modal filterable <Menu.Root> keeps focus inside its popup and renders a ' +
          'visually hidden close button for assistive technology, which needs an accessible ' +
          'name. Pass a translated `closeLabel` to <Menu.FilterProvider>, or set `modal={false}` ' +
          'on <Menu.Root> so Tab leaves the popup instead.',
      );
    }
  }, [open, trapsFocus, closeLabel]);

  const popupId = id ?? defaultFloatingId;
  const { ariaLabel, ariaLabelledBy } = resolveMenuPopupLabel(
    menuProps,
    activeTriggerElement,
    activeTriggerId,
  );

  function handleClose(event: React.MouseEvent<HTMLButtonElement>) {
    store.setOpen(
      false,
      createChangeEventDetails(REASONS.closePress, event.nativeEvent, event.currentTarget),
    );
  }

  return (
    <FilterDropdownPopup
      id={popupId}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      // The consumer's props and ref go to the inner popup only, so each handler runs once.
      render={
        <MenuPopupPlain {...menuProps} id={id} ref={forwardedRef} role="dialog">
          {children}
          {trapsFocus && (
            // Reached through a screen reader's virtual cursor, not Tab: sighted keyboard users
            // leave with Escape and would otherwise land on an invisible control.
            <button
              type="button"
              tabIndex={-1}
              aria-label={closeLabel}
              style={visuallyHiddenInput}
              onClick={handleClose}
            />
          )}
        </MenuPopupPlain>
      }
    />
  );
});

export interface FilteredMenuPopupProps extends MenuPopupProps {}
export interface FilteredMenuPopupState extends MenuPopupState {}

export namespace FilteredMenuPopup {
  export type Props = FilteredMenuPopupProps;
  export type State = FilteredMenuPopupState;
}
