'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingEvents, useFloatingTree, useListItem } from '@floating-ui/react';
import { useMenuCheckboxItem } from './useMenuCheckboxItem';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useBaseUiId } from '../../utils/useBaseUiId';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { itemMapping } from '../utils/styleHookMapping';

const InnerMenuCheckboxItem = React.forwardRef(function InnerMenuItem(
  props: InnerMenuCheckboxItemProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const {
    checked: checkedProp,
    defaultChecked,
    onCheckedChange,
    className,
    closeOnClick = false,
    disabled = false,
    highlighted,
    id,
    menuEvents,
    propGetter,
    render,
    treatMouseupAsClick,
    typingRef,
    ...other
  } = props;

  const { getRootProps, checked } = useMenuCheckboxItem({
    closeOnClick,
    disabled,
    highlighted,
    id,
    menuEvents,
    ref: forwardedRef,
    treatMouseupAsClick,
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
    propGetter: (externalProps) => propGetter(getRootProps(externalProps)),
    customStyleHookMapping: itemMapping,
    extraProps: other,
  });

  return (
    <MenuCheckboxItemContext.Provider value={state}>
      {renderElement()}
    </MenuCheckboxItemContext.Provider>
  );
});

InnerMenuCheckboxItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the checkbox is checked.
   */
  checked: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * If `true`, the menu will close when the menu item is clicked.
   *
   * @default true
   */
  closeOnClick: PropTypes.bool,
  /**
   * The default checked state. Use when the component is uncontrolled.
   *
   * @default false
   */
  defaultChecked: PropTypes.bool,
  /**
   * If `true`, the menu item will be disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  highlighted: PropTypes.bool.isRequired,
  /**
   * The id of the menu item.
   */
  id: PropTypes.string,
  /**
   * A text representation of the menu item's content.
   * Used for keyboard text navigation matching.
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
   * Callback fired when the checked state is changed.
   */
  onCheckedChange: PropTypes.func,
  /**
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
  /**
   * @ignore
   */
  propGetter: PropTypes.func.isRequired,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * @ignore
   */
  treatMouseupAsClick: PropTypes.bool.isRequired,
  /**
   * @ignore
   */
  typingRef: PropTypes.shape({
    current: PropTypes.bool.isRequired,
  }).isRequired,
} as any;

const MemoizedInnerMenuCheckboxItem = React.memo(InnerMenuCheckboxItem);

/**
 * An unstyled checkbox menu item to be used within a Menu.
 */
const MenuCheckboxItem = React.forwardRef(function MenuCheckboxItem(
  props: MenuCheckboxItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, label, ...other } = props;

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useListItem({ label: label ?? itemRef.current?.innerText });
  const mergedRef = useForkRef(forwardedRef, listItem.ref, itemRef);

  const { getItemProps, activeIndex, clickAndDragEnabled, typingRef } = useMenuRootContext();
  const id = useBaseUiId(idProp);

  const highlighted = listItem.index === activeIndex;
  const { events: menuEvents } = useFloatingTree()!;

  // This wrapper component is used as a performance optimization.
  // MenuCheckboxItem reads the context and re-renders the actual MenuCheckboxItem
  // only when it needs to.

  return (
    <MemoizedInnerMenuCheckboxItem
      {...other}
      id={id}
      ref={mergedRef}
      highlighted={highlighted}
      menuEvents={menuEvents}
      propGetter={getItemProps}
      treatMouseupAsClick={clickAndDragEnabled}
      typingRef={typingRef}
    />
  );
});

interface InnerMenuCheckboxItemProps extends MenuCheckboxItem.Props {
  highlighted: boolean;
  propGetter: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  menuEvents: FloatingEvents;
  treatMouseupAsClick: boolean;
  typingRef: React.RefObject<boolean>;
}

namespace MenuCheckboxItem {
  export type State = {
    disabled: boolean;
    highlighted: boolean;
    checked: boolean;
  };

  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * If `true`, the checkbox is checked.
     */
    checked?: boolean;
    /**
     * The default checked state. Use when the component is uncontrolled.
     *
     * @default false
     */
    defaultChecked?: boolean;
    /**
     * Callback fired when the checked state is changed.
     */
    onCheckedChange?: (checked: boolean, event: Event) => void;
    children?: React.ReactNode;
    /**
     * The click handler for the menu item.
     */
    onClick?: React.MouseEventHandler<HTMLElement>;
    /**
     * If `true`, the menu item will be disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * A text representation of the menu item's content.
     * Used for keyboard text navigation matching.
     */
    label?: string;
    /**
     * The id of the menu item.
     */
    id?: string;
    /**
     * If `true`, the menu will close when the menu item is clicked.
     *
     * @default true
     */
    closeOnClick?: boolean;
  }
}

MenuCheckboxItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * If `true`, the checkbox is checked.
   */
  checked: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * If `true`, the menu will close when the menu item is clicked.
   *
   * @default true
   */
  closeOnClick: PropTypes.bool,
  /**
   * The default checked state. Use when the component is uncontrolled.
   *
   * @default false
   */
  defaultChecked: PropTypes.bool,
  /**
   * If `true`, the menu item will be disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The id of the menu item.
   */
  id: PropTypes.string,
  /**
   * A text representation of the menu item's content.
   * Used for keyboard text navigation matching.
   */
  label: PropTypes.string,
  /**
   * Callback fired when the checked state is changed.
   */
  onCheckedChange: PropTypes.func,
  /**
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
} as any;

export { MenuCheckboxItem };
