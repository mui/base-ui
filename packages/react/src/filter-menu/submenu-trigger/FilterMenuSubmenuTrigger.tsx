'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useFilterDropdownItem } from '../../filter-dropdown/item/useFilterDropdownItem';
import { useFilterContextForList } from '../../filter-dropdown/root/FilterDropdownRootContext';
import {
  MenuSubmenuTrigger,
  type MenuSubmenuTriggerProps,
} from '../../menu/submenu-trigger/MenuSubmenuTrigger';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { mergeProps } from '../../merge-props';
import { isTypeableElement } from '../../floating-ui-react/utils';
import type { FilterMenuItemFilterProps } from '../utils/FilterMenuItemFilterProps';

/**
 * A filter menu item that opens a submenu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuSubmenuTrigger = React.forwardRef(function FilterMenuSubmenuTrigger(
  props: FilterMenuSubmenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { label, keywords, ...submenuProps } = props;

  // `virtualFocus` is set only by `FilterMenu.SubmenuRoot`, so it tells this trigger whether the
  // submenu it opens renders a `FilterMenu.Popup` (`role="dialog"`) or a plain `Menu.Popup`
  // (`role="menu"`). The documented plain-submenu recipe relies on the latter.
  const { store, virtualFocus, virtualFocusRef } = useMenuRootContext();
  // Spread rather than passed as `aria-haspopup={undefined}`, which would clear the `'menu'`
  // the menu root already puts on every trigger.
  const ariaHasPopupProps = virtualFocus ? ({ 'aria-haspopup': 'dialog' } as const) : undefined;
  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const parent = store.useState('parent');
  // The trigger sits inside its own submenu's root, whose provider shadows the enclosing one, but
  // it is an item of the list it opens from, which belongs to the parent menu.
  const parentListRef = parent.type === 'menu' ? parent.store.context.itemDomElements : null;
  const parentContext = useFilterContextForList(parentListRef);
  const { visible, ref } = useFilterDropdownItem({
    label,
    keywords,
    children: props.children,
    context: parentContext,
    retainGroup: mounted,
  });
  const mergedRef = useMergedRefs(forwardedRef, ref);

  const triggerProps = mergeProps<typeof MenuSubmenuTrigger>(
    {
      onClick() {
        // Hovering opens the submenu without moving focus into it. A click on the trigger of an
        // open submenu is explicit intent to enter it, so hand its input focus.
        const focusOwner = virtualFocusRef?.current;
        if (store.select('open') && focusOwner && isTypeableElement(focusOwner)) {
          focusOwner.focus({ preventScroll: true });
        }
      },
    },
    submenuProps,
  );

  // Filtering the trigger out unmounts it, leaving its submenu open with no anchor.
  useIsoLayoutEffect(() => {
    if (visible || !open) {
      return;
    }
    store.setOpen(false, createChangeEventDetails(REASONS.none));
  }, [visible, open, store]);

  if (parentContext === null) {
    // A plain parent menu roves DOM focus across its items and never filters them.
    return (
      <MenuSubmenuTrigger
        {...ariaHasPopupProps}
        {...triggerProps}
        label={label}
        ref={forwardedRef}
      />
    );
  }

  return visible || mounted ? (
    <MenuSubmenuTrigger {...ariaHasPopupProps} {...triggerProps} label={label} ref={mergedRef} />
  ) : null;
});

export interface FilterMenuSubmenuTriggerProps
  extends Omit<MenuSubmenuTriggerProps, 'label'>, FilterMenuItemFilterProps {}

export interface FilterMenuSubmenuTriggerState extends MenuSubmenuTrigger.State {}

export namespace FilterMenuSubmenuTrigger {
  export type Props = FilterMenuSubmenuTriggerProps;
  export type State = FilterMenuSubmenuTriggerState;
}
