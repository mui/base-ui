'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { ContextMenuRootContext } from './ContextMenuRootContext';
import { Menu } from '../../menu';

/**
 * A component that creates a context menu activated by right clicking or long pressing.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
const ContextMenuRoot: React.FC<ContextMenuRoot.Props> = function ContextMenu(props) {
  const { children, ...otherProps } = props;

  const [anchor, setAnchor] = React.useState<ContextMenuRootContext['anchor']>({
    getBoundingClientRect() {
      return DOMRect.fromRect({ width: 0, height: 0, x: 0, y: 0 });
    },
  });

  const backdropRef = React.useRef<HTMLDivElement | null>(null);
  const internalBackdropRef = React.useRef<HTMLDivElement | null>(null);
  const actionsRef: ContextMenuRootContext['actionsRef'] = React.useRef(null);

  const contextValue: ContextMenuRootContext = React.useMemo(
    () => ({
      anchor,
      setAnchor,
      actionsRef,
      backdropRef,
      internalBackdropRef,
    }),
    [anchor],
  );

  return (
    <ContextMenuRootContext.Provider value={contextValue}>
      <Menu.Root {...otherProps}>{children}</Menu.Root>
    </ContextMenuRootContext.Provider>
  );
};

namespace ContextMenuRoot {
  export interface State {}

  export interface Props extends Menu.Root.Props {
    children: React.ReactNode;
  }
}

ContextMenuRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
};

export { ContextMenuRoot };
