'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingEvents, useFloatingTree, useListItem } from '@floating-ui/react';
import { MenuItemOwnerState, MenuItemProps } from './MenuItem.types';
import { useMenuItem } from './useMenuItem';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useId } from '../../utils/useId';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { GenericHTMLProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';

interface InnerMenuItemProps extends MenuItemProps {
  highlighted: boolean;
  propGetter: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  menuEvents: FloatingEvents;
  clickAndDragEnabled: boolean;
}

const InnerMenuItem = React.memo(
  React.forwardRef(function InnerMenuItem(
    props: InnerMenuItemProps,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const {
      className,
      disabled = false,
      highlighted,
      id,
      menuEvents,
      propGetter,
      render,
      clickAndDragEnabled,
      ...other
    } = props;

    const { getRootProps } = useMenuItem({
      closeOnClick: true,
      disabled,
      highlighted,
      id,
      menuEvents,
      rootRef: forwardedRef,
      clickAndDragEnabled,
    });

    const ownerState: MenuItemOwnerState = { disabled, highlighted };

    const { renderElement } = useComponentRenderer({
      render: render || 'div',
      className,
      ownerState,
      propGetter: (externalProps) => propGetter(getRootProps(externalProps)),
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
const MenuItem = React.forwardRef(function MenuItem(
  props: MenuItemProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { id: idProp, label, ...other } = props;

  const itemRef = React.useRef<HTMLElement>(null);
  const listItem = useListItem({ label: label ?? itemRef.current?.innerText });
  const mergedRef = useForkRef(forwardedRef, listItem.ref, itemRef);

  const { getItemProps, activeIndex, clickAndDragEnabled } = useMenuRootContext();
  const id = useId(idProp);

  const highlighted = listItem.index === activeIndex;
  const { events: menuEvents } = useFloatingTree()!;

  // This wrapper component is used as a performance optimization.
  // MenuItem reads the context and re-renders the actual MenuItem
  // only when it needs to.

  return (
    <InnerMenuItem
      {...other}
      id={id}
      ref={mergedRef}
      highlighted={highlighted}
      menuEvents={menuEvents}
      propGetter={getItemProps}
      clickAndDragEnabled={clickAndDragEnabled}
    />
  );
});

MenuItem.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * If `true`, the menu item will be disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, the menu item won't receive focus when the mouse moves over it.
   *
   * @default false
   */
  disableFocusOnHover: PropTypes.bool,
  /**
   * @ignore
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
  onClick: PropTypes.func,
} as any;

export { MenuItem };
