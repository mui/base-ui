'use client';
import * as React from 'react';
import { FloatingEvents, useFloatingTree } from '../../floating-ui-react';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useMenuRadioGroupContext } from '../radio-group/MenuRadioGroupContext';
import { MenuRadioItemContext } from './MenuRadioItemContext';
import { itemMapping } from '../utils/styleHookMapping';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { useMenuItem } from '../item/useMenuItem';

const InnerMenuRadioItem = React.memo(
  React.forwardRef(function InnerMenuRadioItem(
    componentProps: InnerMenuRadioItemProps,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const {
      checked,
      setChecked,
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

    const state: MenuRadioItem.State = { disabled, highlighted, checked };

    return useRenderElement('div', componentProps, {
      state,
      customStyleHookMapping: itemMapping,
      ref: [itemRef, forwardedRef],
      props: [
        itemProps,
        {
          role: 'menuitemradio',
          'aria-checked': checked,
          onClick: (event: React.MouseEvent) => {
            setChecked(event.nativeEvent);
          },
        },
        elementProps,
        getItemProps,
      ],
    });
  }),
);

/**
 * A menu item that works like a radio button in a given group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuRadioItem = React.forwardRef(function MenuRadioItem(
  props: MenuRadioItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    id: idProp,
    value,
    label,
    disabled: disabledProp = false,
    closeOnClick = false,
    nativeButton = false,
    ...other
  } = props;

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useCompositeListItem({ label });
  const mergedRef = useForkRef(forwardedRef, listItem.ref, itemRef);

  const { itemProps, activeIndex, allowMouseUpTriggerRef, typingRef } = useMenuRootContext();
  const id = useBaseUiId(idProp);

  const highlighted = listItem.index === activeIndex;
  const { events: menuEvents } = useFloatingTree()!;

  const {
    value: selectedValue,
    setValue: setSelectedValue,
    disabled: groupDisabled,
  } = useMenuRadioGroupContext();

  const disabled = groupDisabled || disabledProp;

  // This wrapper component is used as a performance optimization.
  // MenuRadioItem reads the context and re-renders the actual MenuRadioItem
  // only when it needs to.

  const checked = selectedValue === value;

  const setChecked = React.useCallback(
    (event: Event) => {
      setSelectedValue(value, event);
    },
    [setSelectedValue, value],
  );

  const contextValue = React.useMemo(
    () => ({ checked, highlighted, disabled }),
    [checked, highlighted, disabled],
  );

  return (
    <MenuRadioItemContext.Provider value={contextValue}>
      <InnerMenuRadioItem
        {...other}
        id={id}
        ref={mergedRef}
        disabled={disabled}
        highlighted={highlighted}
        menuEvents={menuEvents}
        itemProps={itemProps}
        allowMouseUpTriggerRef={allowMouseUpTriggerRef}
        checked={selectedValue === value}
        setChecked={setChecked}
        typingRef={typingRef}
        closeOnClick={closeOnClick}
        nativeButton={nativeButton}
      />
    </MenuRadioItemContext.Provider>
  );
});

interface InnerMenuRadioItemProps extends Omit<MenuRadioItem.Props, 'value'> {
  highlighted: boolean;
  itemProps: HTMLProps;
  menuEvents: FloatingEvents;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  checked: boolean;
  setChecked: (event: Event) => void;
  typingRef: React.RefObject<boolean>;
  closeOnClick: boolean;
  nativeButton: boolean;
}

export namespace MenuRadioItem {
  export type State = {
    /**
     * Whether the radio item should ignore user interaction.
     */
    disabled: boolean;
    /**
     * Whether the radio item is currently highlighted.
     */
    highlighted: boolean;
    /**
     * Whether the radio item is currently selected.
     */
    checked: boolean;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Value of the radio item.
     * This is the value that will be set in the MenuRadioGroup when the item is selected.
     */
    value: any;
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
