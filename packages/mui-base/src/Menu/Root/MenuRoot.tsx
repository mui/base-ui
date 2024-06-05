'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { exactProp } from '@mui/utils';
import { MenuRootProps } from './MenuRoot.types';
import { DropdownContext } from '../../useDropdown/DropdownContext';
import { useDropdown } from '../../useDropdown/useDropdown';

/**
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-menu/)
 *
 * API:
 *
 * - [Dropdown API](https://mui.com/base-ui/react-menu/components-api/#dropdown)
 */
function MenuRoot(props: MenuRootProps) {
  const { children, open, defaultOpen, onOpenChange } = props;

  const { contextValue } = useDropdown({
    defaultOpen,
    onOpenChange,
    open,
  });

  return <DropdownContext.Provider value={contextValue}>{children}</DropdownContext.Provider>;
}

MenuRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * If `true`, the dropdown is initially open.
   */
  defaultOpen: PropTypes.bool,
  /**
   * Callback fired when the component requests to be opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Allows to control whether the dropdown is open.
   * This is a controlled counterpart of `defaultOpen`.
   */
  open: PropTypes.bool,
} as any;

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line
  (MenuRoot as any)['propTypes' + ''] = exactProp(MenuRoot.propTypes);
}

export { MenuRoot };
