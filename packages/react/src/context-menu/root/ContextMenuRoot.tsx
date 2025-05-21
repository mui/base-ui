'use client';
import * as React from 'react';
import { ContextMenuRootContext } from './ContextMenuRootContext';
import { Menu } from '../../menu';

/**
 * A component that creates a context menu activated by right clicking or long pressing.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
export function ContextMenuRoot(props: ContextMenuRoot.Props) {
  const { children, ...otherProps } = props;

  const [anchor, setAnchor] = React.useState<ContextMenuRootContext['anchor']>({
    getBoundingClientRect() {
      return DOMRect.fromRect({ width: 0, height: 0, x: 0, y: 0 });
    },
  });

  const backdropRef = React.useRef<HTMLDivElement | null>(null);
  const internalBackdropRef = React.useRef<HTMLDivElement | null>(null);
  const actionsRef: ContextMenuRootContext['actionsRef'] = React.useRef(null);
  const positionerRef = React.useRef<HTMLElement | null>(null);

  const contextValue: ContextMenuRootContext = React.useMemo(
    () => ({
      anchor,
      setAnchor,
      actionsRef,
      backdropRef,
      internalBackdropRef,
      positionerRef,
    }),
    [anchor],
  );

  return (
    <ContextMenuRootContext.Provider value={contextValue}>
      <Menu.Root {...otherProps}>{children}</Menu.Root>
    </ContextMenuRootContext.Provider>
  );
}

export namespace ContextMenuRoot {
  export interface State {}

  export interface Props extends Omit<Menu.Root.Props, 'modal'> {}
}
