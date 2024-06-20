'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuItemOwnerState, MenuItemProps } from './MenuItem.types';
import { useMenuItem } from './useMenuItem';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useMenuPopupContext } from '../Popup/MenuPopupContext';
import { useCompoundItem } from '../../useCompound';
import { useId } from '../../utils/useId';
import { ListItemMetadata } from '../../useList';
import { useForkRef } from '../../utils/useForkRef';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { MenuReducerAction } from '../Root/useMenuRoot.types';

interface InnerMenuItemProps extends MenuItemProps {
  highlighted: boolean;
  dispatch: React.Dispatch<MenuReducerAction>;
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
      ...other
    } = props;

    const { registerItem } = useMenuPopupContext();

    const itemRef = React.useRef<HTMLElement>(null);
    const mergedRef = useForkRef(forwardedRef, itemRef);

    const itemMetadata: ListItemMetadata<string> = React.useMemo(
      () => ({
        value: id ?? '',
        id,
        valueAsString: label ?? itemRef.current?.innerText,
        ref: itemRef,
        disabled,
      }),
      [id, label, disabled],
    );

    useCompoundItem({
      key: id ?? '',
      itemMetadata,
      registerItem,
    });

    const { getRootProps } = useMenuItem({
      id,
      disabled,
      rootRef: mergedRef,
      label,
      highlighted,
      dispatch,
    });

    const ownerState: MenuItemOwnerState = { disabled, highlighted };

    const { renderElement } = useComponentRenderer({
      render: render || 'div',
      className,
      ownerState,
      propGetter: getRootProps,
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
  const { dispatch, state } = useMenuRootContext();
  const id = useId(idProp);

  const highlighted = state.highlightedValue === id;

  // This wrapper component is used as a performance optimization.
  // MenuItem reads the context and re-renders the actual MenuItem
  // only when it needs to.

  return (
    <InnerMenuItem {...props} id={id} ref={ref} dispatch={dispatch} highlighted={highlighted} />
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
