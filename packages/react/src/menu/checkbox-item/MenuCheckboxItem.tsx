'use client';
import * as React from 'react';
import { FloatingEvents, useFloatingTree } from '@floating-ui/react';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';
import { useMenuItem } from '../item/useMenuItem';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { itemMapping } from '../utils/styleHookMapping';
import { useControlled } from '../../utils/useControlled';

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
      submenuTrigger: false,
    });

    const state: MenuCheckboxItem.State = React.useMemo(
      () => ({ disabled, highlighted, checked }),
      [disabled, highlighted, checked],
    );

    const element = useRenderElement('div', componentProps, {
      state,
      customStyleHookMapping: itemMapping,
      props: [
        itemProps,
        {
          role: 'menuitemcheckbox',
          'aria-checked': checked,
          onClick: (event: React.MouseEvent) => {
            setChecked((currentlyChecked) => !currentlyChecked);
            onCheckedChange?.(!checked, event.nativeEvent);
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
  const mergedRef = useForkRef(forwardedRef, listItem.ref, itemRef);

  const { itemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
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

  export interface Props extends BaseUIComponentProps<'div', State> {
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
    onCheckedChange?: (checked: boolean, event: Event) => void;
    children?: React.ReactNode;
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
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default false
     */
    nativeButton?: boolean;
  }
}
