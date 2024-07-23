'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingEvents, useFloatingTree, useListItem } from '@floating-ui/react';
import { useMenuRadioItem } from './useMenuRadioItem';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useId } from '../../utils/useId';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useMenuRadioGroupContext } from '../RadioGroup/MenuRadioGroupContext';

const customStyleHookMapping: CustomStyleHookMapping<MenuRadioItem.OwnerState> = {
  checked: (value: boolean) => ({ 'data-state': value ? 'checked' : 'unchecked' }),
};

const InnerMenuRadioItem = React.memo(
  React.forwardRef(function InnerMenuItem(
    props: InnerMenuRadioItemProps,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const {
      checked,
      setChecked,
      className,
      closeOnClick = false,
      disabled = false,
      highlighted,
      id,
      menuEvents,
      propGetter,
      render,
      treatMouseupAsClick,
      ...other
    } = props;

    const { getRootProps } = useMenuRadioItem({
      checked,
      setChecked,
      closeOnClick,
      disabled,
      highlighted,
      id,
      menuEvents,
      ref: forwardedRef,
      treatMouseupAsClick,
    });

    const ownerState: MenuRadioItem.OwnerState = { disabled, highlighted, checked };

    const { renderElement } = useComponentRenderer({
      render: render || 'div',
      className,
      ownerState,
      propGetter: (externalProps) => propGetter(getRootProps(externalProps)),
      customStyleHookMapping,
      extraProps: other,
    });

    return renderElement();
  }),
);

/**
 * An unstyled menu item to be used within a Menu.
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-menu/)
 *
 * API:
 *
 * - [MenuItem API](https://mui.com/base-ui/react-menu/components-api/#menu-item)
 */
const MenuRadioItem = React.forwardRef(function MenuRadioItem(
  props: MenuRadioItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, value, label, ...other } = props;

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useListItem({ label: label ?? itemRef.current?.innerText });
  const mergedRef = useForkRef(forwardedRef, listItem.ref, itemRef);

  const { getItemProps, activeIndex, clickAndDragEnabled } = useMenuRootContext();
  const id = useId(idProp);

  const highlighted = listItem.index === activeIndex;
  const { events: menuEvents } = useFloatingTree()!;

  const { value: selectedValue, setValue: setSelectedValue } = useMenuRadioGroupContext();

  // This wrapper component is used as a performance optimization.
  // MenuRadioItem reads the context and re-renders the actual MenuRadioItem
  // only when it needs to.

  const setChecked = React.useCallback(
    (event: Event) => {
      setSelectedValue(value, event);
    },
    [setSelectedValue, value],
  );

  return (
    <InnerMenuRadioItem
      {...other}
      id={id}
      ref={mergedRef}
      highlighted={highlighted}
      menuEvents={menuEvents}
      propGetter={getItemProps}
      treatMouseupAsClick={clickAndDragEnabled}
      checked={selectedValue === value}
      setChecked={setChecked}
    />
  );
});

interface InnerMenuRadioItemProps extends Omit<MenuRadioItem.Props, 'value'> {
  highlighted: boolean;
  propGetter: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  menuEvents: FloatingEvents;
  treatMouseupAsClick: boolean;
  checked: boolean;
  setChecked: (event: Event) => void;
}

namespace MenuRadioItem {
  export type OwnerState = {
    disabled: boolean;
    highlighted: boolean;
    checked: boolean;
  };

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    value: any;
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

MenuRadioItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
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
   * @ignore
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
   * @ignore
   */
  onCheckedChange: PropTypes.func,
  /**
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
} as any;

export { MenuRadioItem };
