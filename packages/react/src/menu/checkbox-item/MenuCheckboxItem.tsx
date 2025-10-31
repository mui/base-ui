'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useFloatingTree } from '../../floating-ui-react';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';
import { REGULAR_ITEM, useMenuItem } from '../item/useMenuItem';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../utils/types';
import { itemMapping } from '../utils/stateAttributesMapping';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import type { MenuRoot } from '../root/MenuRoot';

/**
 * A menu item that toggles a setting on or off.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuCheckboxItem = React.forwardRef(function MenuCheckboxItem(
  componentProps: MenuCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    render,
    className,
    id: idProp,
    label,
    nativeButton = false,
    disabled = false,
    closeOnClick = false,
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    ...elementProps
  } = componentProps;

  const listItem = useCompositeListItem({ label });
  const menuPositionerContext = useMenuPositionerContext(true);
  const id = useBaseUiId(idProp);
  const { events: menuEvents } = useFloatingTree()!;

  const { store } = useMenuRootContext();
  const highlighted = store.useState('isActive', listItem.index);
  const itemProps = store.useState('itemProps');

  const [checked, setChecked] = useControlled({
    controlled: checkedProp,
    default: defaultChecked ?? false,
    name: 'MenuCheckboxItem',
    state: 'checked',
  });

  const { getItemProps, itemRef } = useMenuItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    menuEvents,
    store,
    nativeButton,
    nodeId: menuPositionerContext?.floatingContext.nodeId,
    itemMetadata: REGULAR_ITEM,
  });

  const state: MenuCheckboxItem.State = React.useMemo(
    () => ({
      disabled,
      highlighted,
      checked,
    }),
    [disabled, highlighted, checked],
  );

  const handleClick = useStableCallback((event: React.MouseEvent) => {
    const details = createChangeEventDetails('item-press', event.nativeEvent);

    onCheckedChange?.(!checked, details);

    if (details.isCanceled) {
      return;
    }

    setChecked((currentlyChecked) => !currentlyChecked);
  });

  const element = useRenderElement('div', componentProps, {
    state,
    stateAttributesMapping: itemMapping,
    props: [
      itemProps,
      {
        role: 'menuitemcheckbox',
        'aria-checked': checked,
        onClick: handleClick,
      },
      elementProps,
      getItemProps,
    ],
    ref: [itemRef, forwardedRef, listItem.ref],
  });

  return (
    <MenuCheckboxItemContext.Provider value={state}>{element}</MenuCheckboxItemContext.Provider>
  );
});

export type MenuCheckboxItemState = {
  /**
   * Whether the checkbox item should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the checkbox item is currently highlighted.
   */
  highlighted: boolean;
  /**
   * Whether the checkbox item is currently ticked.
   */
  checked: boolean;
};

export interface MenuCheckboxItemProps
  extends NonNativeButtonProps,
    BaseUIComponentProps<'div', MenuCheckboxItem.State> {
  /**
   * Whether the checkbox item is currently ticked.
   *
   * To render an uncontrolled checkbox item, use the `defaultChecked` prop instead.
   */
  checked?: boolean;
  /**
   * Whether the checkbox item is initially ticked.
   *
   * To render a controlled checkbox item, use the `checked` prop instead.
   * @default false
   */
  defaultChecked?: boolean;
  /**
   * Event handler called when the checkbox item is ticked or unticked.
   */
  onCheckedChange?: (checked: boolean, eventDetails: MenuCheckboxItem.ChangeEventDetails) => void;
  /**
   * The click handler for the menu item.
   */
  onClick?: React.MouseEventHandler<HTMLElement>;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label?: string;
  /**
   * @ignore
   */
  id?: string;
  /**
   * Whether to close the menu when the item is clicked.
   * @default false
   */
  closeOnClick?: boolean;
}

export type MenuCheckboxItemChangeEventReason = MenuRoot.ChangeEventReason;
export type MenuCheckboxItemChangeEventDetails = MenuRoot.ChangeEventDetails;

export namespace MenuCheckboxItem {
  export type State = MenuCheckboxItemState;
  export type Props = MenuCheckboxItemProps;
  export type ChangeEventReason = MenuCheckboxItemChangeEventReason;
  export type ChangeEventDetails = MenuCheckboxItemChangeEventDetails;
}
