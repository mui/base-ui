'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuItemOwnerState, MenuItemProps } from './MenuItem.types';
import { useMenuItem } from './useMenuItem';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMenuPopupContext } from '../Popup/MenuPopupContext';
import { useId } from '../../utils/useId';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { MenuReducerAction } from '../Root/menuReducer';
import { ListDirection, ListOrientation } from '../../useList';
import { GenericHTMLProps } from '../../utils/types';

interface InnerMenuItemProps extends MenuItemProps {
  highlighted: boolean;
  dispatch: React.Dispatch<MenuReducerAction>;
  rootDispatch: React.Dispatch<MenuReducerAction>;
  orientation: ListOrientation;
  direction: ListDirection;
  propGetter: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  clickAndDragSupport: boolean;
}

const InnerMenuItem = React.memo(
  React.forwardRef(function MenuItem(
    props: InnerMenuItemProps,
    forwardedRef: React.ForwardedRef<Element>,
  ) {
    const {
      render,
      className,
      disabled = false,
      label,
      id,
      highlighted,
      dispatch,
      rootDispatch,
      orientation,
      direction,
      propGetter,
      clickAndDragSupport,
      ...other
    } = props;

    const { compoundParentContext } = useMenuPopupContext();

    const { getRootProps } = useMenuItem({
      compoundParentContext,
      disabled,
      dispatch,
      rootDispatch,
      highlighted,
      id,
      label,
      rootRef: forwardedRef,
      closeOnClick: true,
      isNested: rootDispatch !== dispatch,
      orientation,
      direction,
      clickAndDragSupport,
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
  ref: React.ForwardedRef<Element>,
) {
  const { id: idProp } = props;
  const { dispatch, topmostContext, state, getItemProps } = useMenuRootContext();
  const { orientation, direction } = state.settings;
  const id = useId(idProp);

  const highlighted = state.highlightedValue === id;
  const clickAndDragSupport =
    topmostContext?.state?.clickAndDragging ?? state.clickAndDragging ?? false;

  // This wrapper component is used as a performance optimization.
  // MenuItem reads the context and re-renders the actual MenuItem
  // only when it needs to.

  return (
    <InnerMenuItem
      {...props}
      id={id}
      ref={ref}
      dispatch={dispatch}
      rootDispatch={topmostContext?.dispatch ?? dispatch}
      highlighted={highlighted}
      orientation={orientation}
      direction={direction}
      propGetter={getItemProps}
      clickAndDragSupport={clickAndDragSupport}
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
