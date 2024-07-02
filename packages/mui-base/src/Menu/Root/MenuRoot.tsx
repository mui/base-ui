'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingTree } from '@floating-ui/react';
import { MenuRootProps } from './MenuRoot.types';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { useMenuRoot } from './useMenuRoot';

function MenuRoot(props: MenuRootProps) {
  const {
    children,
    open,
    defaultOpen,
    onOpenChange,
    orientation = 'vertical',
    dir: direction = 'ltr',
  } = props;

  const parentContext = useMenuRootContext(true);

  const menuRoot = useMenuRoot({
    defaultOpen,
    onOpenChange,
    open,
    parentState: parentContext?.state,
    orientation,
    direction,
  });

  const context: MenuRootContext = React.useMemo(
    () => ({
      ...menuRoot,
      parentContext,
      topmostContext: parentContext != null ? parentContext.topmostContext ?? parentContext : null,
      isNested: parentContext != null,
    }),
    [menuRoot, parentContext],
  );

  if (parentContext == null) {
    // set up a FloatingTree to provide the context to nested menus
    return (
      <FloatingTree>
        <MenuRootContext.Provider value={context}>{children}</MenuRootContext.Provider>
      </FloatingTree>
    );
  }

  return <MenuRootContext.Provider value={context}>{children}</MenuRootContext.Provider>;
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
   * @ignore
   */
  dir: PropTypes.oneOf(['ltr', 'rtl']),
  /**
   * Callback fired when the component requests to be opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Allows to control whether the dropdown is open.
   * This is a controlled counterpart of `defaultOpen`.
   */
  open: PropTypes.bool,
  /**
   * @ignore
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
} as any;

export { MenuRoot };
