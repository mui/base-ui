'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuItemOwnerState, MenuItemProps } from './MenuItem.types';
import { useMenuItem, useMenuItemContextStabilizer } from '../../useMenuItem';
import { useSlotProps } from '../../utils/useSlotProps';
import { ListContext } from '../../useList';

const InnerMenuItem = React.memo(
  React.forwardRef(function MenuItem(
    props: MenuItemProps,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const { children, disabled: disabledProp = false, label, id, ...other } = props;

    const { getRootProps, disabled, focusVisible, highlighted } = useMenuItem({
      id,
      disabled: disabledProp,
      rootRef: forwardedRef,
      label,
    });

    const ownerState: MenuItemOwnerState = { ...props, disabled, focusVisible, highlighted };

    const Root = 'li';
    const rootProps = useSlotProps({
      elementType: Root,
      getSlotProps: getRootProps,
      externalSlotProps: {},
      externalForwardedProps: other,
      ownerState,
    });

    return <Root {...rootProps}>{children}</Root>;
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
  ref: React.ForwardedRef<Element>,
) {
  const { id: idProp } = props;

  // This wrapper component is used as a performance optimization.
  // `useMenuItemContextStabilizer` ensures that the context value
  // is stable across renders, so that the actual MenuItem re-renders
  // only when it needs to.
  const { contextValue, id } = useMenuItemContextStabilizer(idProp);

  return (
    <ListContext.Provider value={contextValue}>
      <InnerMenuItem {...props} id={id} ref={ref} />
    </ListContext.Provider>
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
   * @ignore
   */
  className: PropTypes.string,
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
   * A text representation of the menu item's content.
   * Used for keyboard text navigation matching.
   */
  label: PropTypes.string,
  /**
   * @ignore
   */
  onClick: PropTypes.func,
  /**
   * The props used for each slot inside the MenuItem.
   * @default {}
   */
  slotProps: PropTypes.shape({
    root: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  }),
  /**
   * The components used for each slot inside the MenuItem.
   * Either a string to use a HTML element or a component.
   * @default {}
   */
  slots: PropTypes.shape({
    root: PropTypes.elementType,
  }),
} as any;

export { MenuItem };
