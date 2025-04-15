'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingEvents, useFloatingTree } from '@floating-ui/react';
import { useMenuRadioItem } from './useMenuRadioItem';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useMenuRadioGroupContext } from '../radio-group/MenuRadioGroupContext';
import { MenuRadioItemContext } from './MenuRadioItemContext';
import { itemMapping } from '../utils/styleHookMapping';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { mergeProps } from '../../merge-props';

const InnerMenuRadioItem = React.forwardRef(function InnerMenuItem(
  props: InnerMenuRadioItemProps,
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
    ...other
  } = props;

  const { getItemProps } = useMenuRadioItem({
    checked,
    setChecked,
    closeOnClick,
    disabled,
    highlighted,
    id,
    menuEvents,
    ref: forwardedRef,
    allowMouseUpTriggerRef,
    typingRef,
  });

  const state: MenuRadioItem.State = { disabled, highlighted, checked };

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    state,
    propGetter: (externalProps) => mergeProps(itemProps, externalProps, getItemProps),
    customStyleHookMapping: itemMapping,
    extraProps: other,
  });

  return renderElement();
});

/**
 * A menu item that works like a radio button in a given group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */

InnerMenuRadioItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  allowMouseUpTriggerRef: PropTypes.shape({
    current: PropTypes.bool.isRequired,
  }).isRequired,
  /**
   * @ignore
   */
  checked: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether to close the menu when the item is clicked.
   */
  closeOnClick: PropTypes.bool.isRequired,
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  highlighted: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * @ignore
   */
  itemProps: PropTypes.object.isRequired,
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label: PropTypes.string,
  /**
   * @ignore
   */
  menuEvents: PropTypes.shape({
    emit: PropTypes.func.isRequired,
    off: PropTypes.func.isRequired,
    on: PropTypes.func.isRequired,
  }).isRequired,
  /**
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  setChecked: PropTypes.func.isRequired,
  /**
   * @ignore
   */
  typingRef: PropTypes.shape({
    current: PropTypes.bool.isRequired,
  }).isRequired,
} as any;

const MemoizedInnerMenuRadioItem = React.memo(InnerMenuRadioItem);

/**
 * A menu item that works like a radio button in a given group.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuRadioItem = React.forwardRef(function MenuRadioItem(
  props: MenuRadioItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    id: idProp,
    value,
    label,
    disabled: disabledProp = false,
    closeOnClick = false,
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
      <MemoizedInnerMenuRadioItem
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
      />
    </MenuRadioItemContext.Provider>
  );
});

interface InnerMenuRadioItemProps extends Omit<MenuRadioItem.Props, 'value'> {
  highlighted: boolean;
  itemProps: GenericHTMLProps;
  menuEvents: FloatingEvents;
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  checked: boolean;
  setChecked: (event: Event) => void;
  typingRef: React.RefObject<boolean>;
  closeOnClick: boolean;
}

namespace MenuRadioItem {
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
  }
}

MenuRadioItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether to close the menu when the item is clicked.
   * @default false
   */
  closeOnClick: PropTypes.bool,
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * Overrides the text label to use when the item is matched during keyboard text navigation.
   */
  label: PropTypes.string,
  /**
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * Value of the radio item.
   * This is the value that will be set in the MenuRadioGroup when the item is selected.
   */
  value: PropTypes.any.isRequired,
} as any;

export { MenuRadioItem };
