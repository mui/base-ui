'use client';
import * as React from 'react';
import { useScrollLock } from '@base-ui/utils/useScrollLock';
import {
  FloatingNode,
  FloatingTree,
  useFloatingNodeId,
  useFloatingTree,
} from '../floating-ui-react';
import { type MenuRoot } from '../menu/root/MenuRoot';
import { BaseUIComponentProps } from '../utils/types';
import { MenubarContext, useMenubarContext } from './MenubarContext';
import { useOpenInteractionType } from '../utils/useOpenInteractionType';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useBaseUiId } from '../utils/useBaseUiId';
import { MenuOpenEventDetails } from '../menu/utils/types';
import { StateAttributesMapping } from '../utils/getStateAttributesProps';

const menubarStateAttributesMapping: StateAttributesMapping<Menubar.State> = {
  hasSubmenuOpen(value) {
    return {
      'data-has-submenu-open': value ? 'true' : 'false',
    };
  },
};

/**
 * The container for menus.
 *
 * Documentation: [Base UI Menubar](https://base-ui.com/react/components/menubar)
 */
export const Menubar = React.forwardRef(function Menubar(
  props: Menubar.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    orientation = 'horizontal',
    loopFocus = true,
    render,
    className,
    modal = true,
    disabled = false,
    id: idProp,
    ...elementProps
  } = props;

  const [contentElement, setContentElement] = React.useState<HTMLElement | null>(null);
  const [hasSubmenuOpen, setHasSubmenuOpen] = React.useState(false);

  const {
    openMethod,
    triggerProps: interactionTypeProps,
    reset: resetOpenInteractionType,
  } = useOpenInteractionType(hasSubmenuOpen);

  React.useEffect(() => {
    if (!hasSubmenuOpen) {
      resetOpenInteractionType();
    }
  }, [hasSubmenuOpen, resetOpenInteractionType]);

  useScrollLock(modal && hasSubmenuOpen && openMethod !== 'touch', contentElement);

  const id = useBaseUiId(idProp);

  const state: Menubar.State = {
    orientation,
    modal,
    hasSubmenuOpen,
  };

  const contentRef = React.useRef<HTMLDivElement>(null);
  const allowMouseUpTriggerRef = React.useRef(false);

  const context: MenubarContext = React.useMemo(
    () => ({
      contentElement,
      setContentElement,
      setHasSubmenuOpen,
      hasSubmenuOpen,
      modal,
      disabled,
      orientation,
      allowMouseUpTriggerRef,
      rootId: id,
    }),
    [contentElement, hasSubmenuOpen, modal, disabled, orientation, id],
  );

  return (
    <MenubarContext.Provider value={context}>
      <FloatingTree>
        <MenubarContent>
          <CompositeRoot
            render={render}
            className={className}
            state={state}
            stateAttributesMapping={menubarStateAttributesMapping}
            refs={[forwardedRef, setContentElement, contentRef]}
            props={[{ role: 'menubar', id }, interactionTypeProps, elementProps]}
            orientation={orientation}
            loopFocus={loopFocus}
            highlightItemOnHover={hasSubmenuOpen}
          />
        </MenubarContent>
      </FloatingTree>
    </MenubarContext.Provider>
  );
});

function MenubarContent(props: React.PropsWithChildren<{}>) {
  const nodeId = useFloatingNodeId();
  const { events: menuEvents } = useFloatingTree()!;
  const rootContext = useMenubarContext();

  React.useEffect(() => {
    function onSubmenuOpenChange(details: MenuOpenEventDetails) {
      if (!details.nodeId || details.parentNodeId !== nodeId) {
        return;
      }

      if (details.open) {
        if (!rootContext.hasSubmenuOpen) {
          rootContext.setHasSubmenuOpen(true);
        }
      } else if (details.reason !== 'sibling-open' && details.reason !== 'list-navigation') {
        rootContext.setHasSubmenuOpen(false);
      }
    }

    menuEvents.on('menuopenchange', onSubmenuOpenChange);

    return () => {
      menuEvents.off('menuopenchange', onSubmenuOpenChange);
    };
  }, [menuEvents, nodeId, rootContext]);

  return <FloatingNode id={nodeId}>{props.children}</FloatingNode>;
}

export interface MenubarState {
  /**
   * The orientation of the menubar.
   */
  orientation: MenuRoot.Orientation;
  /**
   * Whether the menubar is modal.
   */
  modal: boolean;
  /**
   * Whether any submenu within the menubar is open.
   */
  hasSubmenuOpen: boolean;
}

export interface MenubarProps extends BaseUIComponentProps<'div', Menubar.State> {
  /**
   * Whether the menubar is modal.
   * @default true
   */
  modal?: boolean | undefined;
  /**
   * Whether the whole menubar is disabled.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The orientation of the menubar.
   * @default 'horizontal'
   */
  orientation?: MenuRoot.Orientation | undefined;
  /**
   * Whether to loop keyboard focus back to the first item
   * when the end of the list is reached while using the arrow keys.
   * @default true
   */
  loopFocus?: boolean | undefined;
}

export namespace Menubar {
  export type State = MenubarState;
  export type Props = MenubarProps;
}
