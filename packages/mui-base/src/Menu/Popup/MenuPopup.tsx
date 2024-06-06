'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { MenuPopupOwnerState, MenuPopupProps } from './MenuPopup.types';
import { useMenuPopup } from './useMenuPopup';
import { MenuPopupProvider } from './MenuPopupProvider';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

/**
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-menu/)
 *
 * API:
 *
 * - [Menu API](https://mui.com/base-ui/react-menu/components-api/#menu)
 */
const MenuPopup = React.forwardRef(function MenuPopup(
  props: MenuPopupProps,
  forwardedRef: React.ForwardedRef<Element>,
) {
  const { render, className, onItemsChange, ...other } = props;

  const { contextValue, getListboxProps, open } = useMenuPopup({
    onItemsChange,
    componentName: 'Menu',
    listboxRef: forwardedRef,
  });

  const ownerState: MenuPopupOwnerState = { open };

  const { renderElement } = useComponentRenderer({
    render: render || 'div',
    className,
    ownerState,
    propGetter: getListboxProps,
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
    },
    extraProps: other,
  });

  return open && <MenuPopupProvider value={contextValue}>{renderElement()}</MenuPopupProvider>;
});

MenuPopup.propTypes /* remove-proptypes */ = {
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
   * Function called when the items displayed in the menu change.
   */
  onItemsChange: PropTypes.func,
} as any;

export { MenuPopup };
