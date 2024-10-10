'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingEvents, useFloatingTree, useListItem } from '@floating-ui/react';
import { useMenuRadioItem } from './useMenuRadioItem';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useId } from '../../utils/useId';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { useMenuRadioGroupContext } from '../RadioGroup/MenuRadioGroupContext';
import { MenuRadioItemContext } from './MenuRadioItemContext';
import { radioItemMapping } from '../utils/styleHookMapping';

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
      typingRef,
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
      typingRef,
    });

    const ownerState: MenuRadioItem.OwnerState = { disabled, highlighted, checked };

    const { renderElement } = useComponentRenderer({
      render: render || 'div',
      className,
      ownerState,
      propGetter: (externalProps) => propGetter(getRootProps(externalProps)),
      customStyleHookMapping: radioItemMapping,
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
 * - [Menu](https://base-ui.netlify.app/components/react-menu/)
 *
 * API:
 *
 * - [MenuRadioItem API](https://base-ui.netlify.app/components/react-menu/#api-reference-MenuRadioItem)
 */
const MenuRadioItem = React.forwardRef(function MenuRadioItem(
  props: MenuRadioItem.Props,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, value, label, disabled = false, ...other } = props;

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useListItem({ label: label ?? itemRef.current?.innerText });
  const mergedRef = useForkRef(forwardedRef, listItem.ref, itemRef);

  const { getItemProps, activeIndex, clickAndDragEnabled, typingRef } = useMenuRootContext();
  const id = useId(idProp);

  const highlighted = listItem.index === activeIndex;
  const { events: menuEvents } = useFloatingTree()!;

  const { value: selectedValue, setValue: setSelectedValue } = useMenuRadioGroupContext();

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
        highlighted={highlighted}
        menuEvents={menuEvents}
        propGetter={getItemProps}
        treatMouseupAsClick={clickAndDragEnabled}
        checked={selectedValue === value}
        setChecked={setChecked}
        typingRef={typingRef}
      />
    </MenuRadioItemContext.Provider>
  );
});

interface InnerMenuRadioItemProps extends Omit<MenuRadioItem.Props, 'value'> {
  highlighted: boolean;
  propGetter: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  menuEvents: FloatingEvents;
  treatMouseupAsClick: boolean;
  checked: boolean;
  setChecked: (event: Event) => void;
  typingRef: React.RefObject<boolean>;
}

namespace MenuRadioItem {
  export type OwnerState = {
    disabled: boolean;
    highlighted: boolean;
    checked: boolean;
  };

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
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
  children: PropTypes.node,
  /**
   * If `true`, the menu will close when the menu item is clicked.
   *
   * @default true
   */
  closeOnClick: PropTypes.bool,
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
   * The click handler for the menu item.
   */
  onClick: PropTypes.func,
  /**
   * Value of the radio item.
   * This is the value that will be set in the MenuRadioGroup when the item is selected.
   */
  value: PropTypes.any.isRequired,
} as any;

export { MenuRadioItem };
