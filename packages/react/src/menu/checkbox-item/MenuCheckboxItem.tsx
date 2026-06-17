'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';
import { REGULAR_ITEM, useMenuItem } from '../item/useMenuItem';
import { useCompositeListItem } from '../../internals/composite/list/useCompositeListItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { useBaseUiId } from '../../internals/useBaseUiId';
import type { NativeButtonComponentProps } from '../../internals/types';
import { itemMapping } from '../utils/stateAttributesMapping';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { MenuRoot } from '../root/MenuRoot';

/**
 * A menu item that toggles a setting on or off.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuCheckboxItem = React.forwardRef(function MenuCheckboxItem(
  componentProps: MenuCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
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
    style,
    ...elementProps
  } = componentProps;

  const listItem = useCompositeListItem({ label });
  const menuPositionerContext = useMenuPositionerContext(true);
  const id = useBaseUiId(idProp);

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
    store,
    nativeButton,
    nodeId: menuPositionerContext?.context.nodeId,
    itemMetadata: REGULAR_ITEM,
  });

  const state: MenuCheckboxItemState = React.useMemo(
    () => ({
      disabled,
      highlighted,
      checked,
    }),
    [disabled, highlighted, checked],
  );

  function handleClick(event: React.MouseEvent) {
    const details = createChangeEventDetails(REASONS.itemPress, event.nativeEvent, undefined, {
      preventUnmountOnClose() {},
    });

    onCheckedChange?.(!checked, details);

    if (details.isCanceled) {
      return;
    }

    setChecked((currentlyChecked) => !currentlyChecked);
  }

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
      elementProps as React.HTMLAttributes<HTMLDivElement>,
      getItemProps,
    ],
    ref: [itemRef, forwardedRef, listItem.ref],
  });

  return (
    <MenuCheckboxItemContext.Provider value={state}>{element}</MenuCheckboxItemContext.Provider>
  );
}) as unknown as MenuCheckboxItemComponent;

export interface MenuCheckboxItemState {
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
}

export type MenuCheckboxItemProps<TNativeButton extends boolean = false> = Omit<
  NativeButtonComponentProps<TNativeButton, MenuCheckboxItem.State, false>,
  'disabled' | 'onClick'
> & {
  /**
   * Whether the checkbox item is currently ticked.
   *
   * To render an uncontrolled checkbox item, use the `defaultChecked` prop instead.
   */
  checked?: boolean | undefined;
  /**
   * Whether the checkbox item is initially ticked.
   *
   * To render a controlled checkbox item, use the `checked` prop instead.
   * @default false
   */
  defaultChecked?: boolean | undefined;
  /**
   * Event handler called when the checkbox item is ticked or unticked.
   */
  onCheckedChange?:
    | ((checked: boolean, eventDetails: MenuCheckboxItem.ChangeEventDetails) => void)
    | undefined;
  /**
   * The click handler for the menu item.
   */
  onClick?:
    | NativeButtonComponentProps<TNativeButton, MenuCheckboxItem.State, false>['onClick']
    | undefined;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label?: string | undefined;
  /**
   * @ignore
   */
  id?: string | undefined;
  /**
   * Whether to close the menu when the item is clicked.
   * @default false
   */
  closeOnClick?: boolean | undefined;
};

export type MenuCheckboxItemChangeEventReason = MenuRoot.ChangeEventReason;
export type MenuCheckboxItemChangeEventDetails = MenuRoot.ChangeEventDetails;

export namespace MenuCheckboxItem {
  export type State = MenuCheckboxItemState;
  export type Props<TNativeButton extends boolean = false> = MenuCheckboxItemProps<TNativeButton>;
  export type ChangeEventReason = MenuCheckboxItemChangeEventReason;
  export type ChangeEventDetails = MenuCheckboxItemChangeEventDetails;
}

type MenuCheckboxItemComponent = {
  (
    props: MenuCheckboxItem.Props<false> & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
  (
    props: MenuCheckboxItem.Props<true> & { nativeButton: true } & {
      ref?: React.Ref<HTMLButtonElement> | undefined;
    },
  ): React.ReactElement | null;
  (
    props: MenuCheckboxItem.Props<boolean> & { nativeButton: boolean } & {
      ref?: React.Ref<HTMLElement> | undefined;
    },
  ): React.ReactElement | null;
};
