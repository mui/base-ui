'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { FloatingEvents, useFloatingTree } from '../../floating-ui-react';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';
import { REGULAR_ITEM, useMenuItem } from '../item/useMenuItem';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, HTMLProps, NonNativeButtonProps } from '../../utils/types';
import { itemMapping } from '../utils/stateAttributesMapping';
import { useMenuPositionerContext } from '../positioner/MenuPositionerContext';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';
import type { MenuRoot } from '../root/MenuRoot';

const InnerMenuCheckboxItem = React.memo(
  React.forwardRef(function InnerMenuCheckboxItem(
    componentProps: InnerMenuCheckboxItemProps,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const {
      checked: checkedProp,
      defaultChecked,
      onCheckedChange,
      className,
      closeOnClick,
      disabled = false,
      highlighted,
      id,
      menuEvents,
      itemProps,
      render,
      allowMouseUpTriggerRef,
      typingRef,
      nativeButton,
      nodeId,
      ...elementProps
    } = componentProps;

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
      allowMouseUpTriggerRef,
      typingRef,
      nativeButton,
      nodeId,
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

    const element = useRenderElement('div', componentProps, {
      state,
      stateAttributesMapping: itemMapping,
      props: [
        itemProps,
        {
          role: 'menuitemcheckbox',
          'aria-checked': checked,
          onClick(event: React.MouseEvent) {
            const details = createBaseUIEventDetails('item-press', event.nativeEvent);

            onCheckedChange?.(!checked, details);

            if (details.isCanceled) {
              return;
            }

            setChecked((currentlyChecked) => !currentlyChecked);
          },
        },
        elementProps,
        getItemProps,
      ],
      ref: [itemRef, forwardedRef],
    });

    return (
      <MenuCheckboxItemContext.Provider value={state}>{element}</MenuCheckboxItemContext.Provider>
    );
  }),
);

/**
 * A menu item that toggles a setting on or off.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuCheckboxItem = React.forwardRef(function MenuCheckboxItem(
  props: MenuCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, label, closeOnClick = false, nativeButton = false, ...other } = props;

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useCompositeListItem({ label });
  const mergedRef = useMergedRefs(forwardedRef, listItem.ref, itemRef);

  const { itemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
  const menuPositionerContext = useMenuPositionerContext(true);

  const id = useBaseUiId(idProp);

  const highlighted = listItem.index === activeIndex;
  const { events: menuEvents } = useFloatingTree()!;

  // This wrapper component is used as a performance optimization.
  // MenuCheckboxItem reads the context and re-renders the actual MenuCheckboxItem
  // only when it needs to.

  return (
    <InnerMenuCheckboxItem
      {...other}
      id={id}
      ref={mergedRef}
      highlighted={highlighted}
      menuEvents={menuEvents}
      itemProps={itemProps}
      allowMouseUpTriggerRef={allowMouseUpTriggerRef}
      typingRef={typingRef}
      closeOnClick={closeOnClick}
      nativeButton={nativeButton}
      nodeId={menuPositionerContext?.floatingContext.nodeId}
    />
  );
});

interface InnerMenuCheckboxItemProps extends MenuCheckboxItem.Props {
  highlighted: boolean;
  itemProps: HTMLProps;
  menuEvents: FloatingEvents;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  typingRef: React.RefObject<boolean>;
  closeOnClick: boolean;
  nativeButton: boolean;
  nodeId: string | undefined;
}

export namespace MenuCheckboxItem {
  export type State = {
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

  export interface Props extends NonNativeButtonProps, BaseUIComponentProps<'div', State> {
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
    onCheckedChange?: (checked: boolean, eventDetails: ChangeEventDetails) => void;
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

  export type ChangeEventReason = MenuRoot.ChangeEventReason;
  export type ChangeEventDetails = MenuRoot.ChangeEventDetails;
}
