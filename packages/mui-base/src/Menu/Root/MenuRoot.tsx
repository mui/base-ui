'use client';
import * as React from 'react';
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

export { MenuRoot };
