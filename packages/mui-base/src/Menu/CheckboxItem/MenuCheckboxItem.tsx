'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingEvents, useFloatingTree, useListItem } from '@floating-ui/react';
import { useMenuCheckboxItem } from './useMenuCheckboxItem';
import { MenuCheckboxItemContext } from './MenuCheckboxItemContext';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useId } from '../../utils/useId';
import type { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';

const customStyleHookMapping: CustomStyleHookMapping<MenuCheckboxItem.OwnerState> = {
  checked: (value: boolean) => ({ 'data-checkboxitem': value ? 'checked' : 'unchecked' }),
};

const InnerMenuCheckboxItem = React.memo(
  React.forwardRef(function InnerMenuItem(
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

    const ownerState: MenuCheckboxItem.OwnerState = React.useMemo(
      () => ({ disabled, highlighted, checked }),
      [disabled, highlighted, checked],
    );

    const { renderElement } = useComponentRenderer({
      render: render || 'div',
      className,
      ownerState,
      propGetter: (externalProps) => propGetter(getRootProps(externalProps)),
      customStyleHookMapping,
      extraProps: other,
    });

    return (
      <MenuCheckboxItemContext.Provider value={ownerState}>
        {renderElement()}
      </MenuCheckboxItemContext.Provider>
    );
  }),
);
/**
 *
 * Demos:
 *
 * - [Menu](https://base-ui.netlify.app/components/react-menu/)
 *
 * API:
 *
 * - [MenuCheckboxItem API](https://base-ui.netlify.app/components/react-menu/#api-reference-MenuCheckboxItem)
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
  const id = useId(idProp);

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
  export type OwnerState = {
    disabled: boolean;
    highlighted: boolean;
    checked: boolean;
  };

  export interface Props extends BaseUIComponentProps<'div', OwnerState> {
    checked?: boolean;
    defaultChecked?: boolean;
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

export { MenuCheckboxItem };
