'use client';
import * as React from 'react';
import { useFilterDropdownPopup } from '../../filter-dropdown/popup/useFilterDropdownPopup';
import { MenuPopupPlain, type MenuPopupProps } from '../popup/MenuPopup';
import { mergeProps } from '../../merge-props';

/**
 * A container for the filter input and item list.
 * Renders a `<div>` element with a `dialog` role.
 */
export const FilteredMenuPopup = React.forwardRef(function FilteredMenuPopup(
  props: MenuPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const interactionProps = useFilterDropdownPopup();
  const popupProps = mergeProps<typeof MenuPopupPlain>(interactionProps, props);

  return <MenuPopupPlain {...popupProps} role="dialog" ref={forwardedRef} />;
});
