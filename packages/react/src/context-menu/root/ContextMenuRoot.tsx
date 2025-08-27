'use client';
import * as React from 'react';
import { useId } from '@base-ui-components/utils/useId';
import { ContextMenuRootContext } from './ContextMenuRootContext';
import { Menu } from '../../menu';
import { MenuRootContext } from '../../menu/root/MenuRootContext';
import { BaseUIEventDetails } from '../../types';
import { BaseUIChangeReason } from '../../utils/types';

/**
 * A component that creates a context menu activated by right clicking or long pressing.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Context Menu](https://base-ui.com/react/components/context-menu)
 */
export function ContextMenuRoot(props: ContextMenuRoot.Props) {
  const [anchor, setAnchor] = React.useState<ContextMenuRootContext['anchor']>({
    getBoundingClientRect() {
      return DOMRect.fromRect({ width: 0, height: 0, x: 0, y: 0 });
    },
  });

  const backdropRef = React.useRef<HTMLDivElement | null>(null);
  const internalBackdropRef = React.useRef<HTMLDivElement | null>(null);
  const actionsRef: ContextMenuRootContext['actionsRef'] = React.useRef(null);
  const positionerRef = React.useRef<HTMLElement | null>(null);
  const allowMouseUpTriggerRef = React.useRef(true);
  const id = useId();

  const contextValue: ContextMenuRootContext = React.useMemo(
    () => ({
      anchor,
      setAnchor,
      actionsRef,
      backdropRef,
      internalBackdropRef,
      positionerRef,
      allowMouseUpTriggerRef,
      rootId: id,
    }),
    [anchor, id],
  );

  return (
    <ContextMenuRootContext.Provider value={contextValue}>
      <MenuRootContext.Provider value={undefined}>
        <Menu.Root {...props} />
      </MenuRootContext.Provider>
    </ContextMenuRootContext.Provider>
  );
}

export namespace ContextMenuRoot {
  export interface State {}

  export interface Props
    extends Omit<
      Menu.Root.Props,
      'modal' | 'openOnHover' | 'delay' | 'closeDelay' | 'onOpenChange'
    > {
    /**
     * Event handler called when the menu is opened or closed.
     */
    onOpenChange?: (open: boolean, eventDetails: ChangeEventDetails) => void;
  }

  export type ChangeEventReason = BaseUIChangeReason | 'sibling-open';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}
