'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { exactProp } from '@mui/utils';
import { MenuRootProps } from './MenuRoot.types';
import { MenuRootContext } from './MenuRootContext';
import { useMenuRoot } from './useMenuRoot';

function MenuRoot(props: MenuRootProps) {
  const { children, open, defaultOpen, onOpenChange } = props;

  const stateAndDispatch = useMenuRoot({
    defaultOpen,
    onOpenChange,
    open,
  });

  return <MenuRootContext.Provider value={stateAndDispatch}>{children}</MenuRootContext.Provider>;
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
