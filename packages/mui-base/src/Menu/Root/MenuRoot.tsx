'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingTree } from '@floating-ui/react';
import { MenuRootProps } from './MenuRoot.types';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { useMenuRoot } from './useMenuRoot';

function MenuRoot(props: MenuRootProps) {
  const {
    animated = true,
    children,
    defaultOpen = false,
    dir: direction = 'ltr',
    disabled = false,
    escapeClosesParents = true,
    onOpenChange,
    open,
    orientation = 'vertical',
  } = props;

  const parentContext = useMenuRootContext(true);
  const nested = parentContext != null;

  const menuRoot = useMenuRoot({
    animated,
    direction,
    disabled,
    escapeClosesParents,
    onOpenChange,
    defaultOpen,
    open,
    orientation,
    nested,
  });

  const [localClickAndDragEnabled, setLocalClickAndDragEnabled] = React.useState(false);
  let clickAndDragEnabled = localClickAndDragEnabled;
  let setClickAndDragEnabled = setLocalClickAndDragEnabled;

  if (parentContext != null) {
    clickAndDragEnabled = parentContext.clickAndDragEnabled;
    setClickAndDragEnabled = parentContext.setClickAndDragEnabled;
  }

  const context: MenuRootContext = React.useMemo(
    () => ({
      ...menuRoot,
      nested,
      parentContext,
      disabled,
      clickAndDragEnabled,
      setClickAndDragEnabled,
    }),
    [menuRoot, nested, parentContext, disabled, clickAndDragEnabled, setClickAndDragEnabled],
  );

  if (!nested) {
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
   * @ignore
   */
  disabled: PropTypes.bool,
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
