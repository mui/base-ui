'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useFilterDropdownPopup } from '../../filter-dropdown/popup/useFilterDropdownPopup';
import type { FloatingFocusManagerProps } from '../../floating-ui-react/components/FloatingFocusManager';
import { MenuPopupPlain, type MenuPopupProps } from '../popup/MenuPopup';
import { useMenuRootContext } from '../root/MenuRootContext';
import { mergeProps } from '../../merge-props';
import { REASONS } from '../../internals/reasons';
import { selectTrapsFocus } from './selectTrapsFocus';

/**
 * A container for the filter input and item list.
 * Renders a `<div>` element with a `dialog` role.
 */
export const FilteredMenuPopup = React.forwardRef(function FilteredMenuPopup(
  props: MenuPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { store, virtualFocusRef, virtualFocusAutoFocus } = useMenuRootContext();
  const open = store.useState('open');
  const parent = store.useState('parent');
  const openMethod = store.useState('openMethod');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');
  const trapsFocus = useStore(store, selectTrapsFocus);
  const interactionProps = useFilterDropdownPopup();

  const openedByHover = open && lastOpenChangeReason === REASONS.triggerHover;
  const shouldFocusPopup =
    parent.type !== 'menu' ||
    (open &&
      (openMethod === 'keyboard' ||
        lastOpenChangeReason === REASONS.listNavigation ||
        lastOpenChangeReason === REASONS.triggerHover ||
        lastOpenChangeReason === REASONS.triggerPress));

  // The input holds real focus; the popup is never the focus target.
  let initialFocus: FloatingFocusManagerProps['initialFocus'] = false;
  if (shouldFocusPopup) {
    initialFocus = () => {
      // Hover only shows the popup; focus follows the pointer in unless the input opts in.
      if (openedByHover && !virtualFocusAutoFocus) {
        return false;
      }
      return virtualFocusRef?.current ?? false;
    };
  }

  const popupProps = mergeProps<typeof MenuPopupPlain>(interactionProps, props);

  return (
    <MenuPopupPlain
      {...popupProps}
      role="dialog"
      initialFocus={initialFocus}
      modal={trapsFocus}
      ref={forwardedRef}
    />
  );
});
