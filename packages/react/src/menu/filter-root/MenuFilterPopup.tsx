'use client';
import * as React from 'react';
import { useMenuFilterPopup } from './useMenuFilterPopup';
import type { FloatingFocusManagerProps } from '../../floating-ui-react/components/FloatingFocusManager';
import { MenuPopupPlain, type MenuPopupProps } from '../popup/MenuPopup';
import { useMenuRootContext } from '../root/MenuRootContext';
import { mergeProps } from '../../merge-props';
import { REASONS } from '../../internals/reasons';

/**
 * A container for the filter input and item list.
 * Renders a `<div>` element with a `dialog` role.
 */
export const MenuFilterPopup = React.forwardRef(function MenuFilterPopup(
  props: MenuPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { store, orientation } = useMenuRootContext();

  const open = store.useState('open');
  const parent = store.useState('parent');
  const openMethod = store.useState('openMethod');
  const lastOpenChangeReason = store.useState('lastOpenChangeReason');

  const interactionProps = useMenuFilterPopup(orientation);

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
      // Touch and pen openings require explicit autofocus.
      if (
        !store.context.virtualFocusAutoFocus &&
        (openedByHover || openMethod === 'touch' || openMethod === 'pen')
      ) {
        return false;
      }
      return store.context.virtualFocusRef?.current ?? false;
    };
  }

  const popupProps = mergeProps<typeof MenuPopupPlain>(interactionProps, props);

  return (
    <MenuPopupPlain
      {...popupProps}
      role="dialog"
      initialFocus={initialFocus}
      modal={false}
      ref={forwardedRef}
    />
  );
});
