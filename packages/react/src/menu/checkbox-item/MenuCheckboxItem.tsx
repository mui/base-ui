'use client';
import * as React from 'react';
import { FloatingEvents, useFloatingTree } from '@floating-ui/react';
import { useMenuCheckboxItem } from './useMenuCheckboxItem';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { itemMapping } from '../utils/styleHookMapping';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { mergeProps } from '../../merge-props';

const InnerMenuCheckboxItem = React.memo(
  React.forwardRef(function InnerMenuCheckboxItem(
    props: InnerMenuCheckboxItemProps,
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
      ...other
    } = props;

    const { getItemProps, checked } = useMenuCheckboxItem({
      closeOnClick,
      disabled,
      highlighted,
      id,
      menuEvents,
      ref: forwardedRef,
      allowMouseUpTriggerRef,
      checked: checkedProp,
      defaultChecked,
      onCheckedChange,
      typingRef,
    });

    const state: MenuCheckboxItem.State = React.useMemo(
      () => ({ disabled, highlighted, checked }),
      [disabled, highlighted, checked],
    );

    const { renderElement } = useComponentRenderer({
      render: render || 'div',
      className,
      state,
      propGetter: (externalProps) => mergeProps(itemProps, externalProps, getItemProps),
      customStyleHookMapping: itemMapping,
      extraProps: other,
    });

    return (
      <MenuCheckboxItemContext.Provider value={state}>
        {renderElement()}
      </MenuCheckboxItemContext.Provider>
    );
  }),
);

/**
 * A menu item that toggles a setting on or off.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuCheckboxItem = React.forwardRef(function MenuCheckboxItem(
  props: MenuCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, label, closeOnClick = false, ...other } = props;

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
    />
  );
});

/* eslint-disable react/no-unused-prop-types */
/* false positives */
interface InnerMenuCheckboxItemProps extends MenuCheckboxItem.Props {
  highlighted: boolean;
  itemProps: GenericHTMLProps;
  menuEvents: FloatingEvents;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  typingRef: React.RefObject<boolean>;
  closeOnClick: boolean;
}

/* eslint-enable react/no-unused-prop-types */

namespace MenuCheckboxItem {
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
  }
}

export { MenuCheckboxItem };
