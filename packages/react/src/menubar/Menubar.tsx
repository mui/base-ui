'use client';

import * as React from 'react';
import { FloatingNode, FloatingTree, useFloatingNodeId, useFloatingTree } from '@floating-ui/react';
import { MenuOrientation } from '../menu/root/useMenuRoot';
import { BaseUIComponentProps } from '../utils/types';
import { MenubarContext, useMenubarContext } from './MenubarContext';
import { useScrollLock } from '../utils';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useRenderElement } from '../utils/useRenderElement';
import { AnimationFrame } from '../utils/useAnimationFrame';

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
    loop = true,
    render,
    className,
    modal = true,
    ...otherProps
  } = props;

  const [contentElement, setContentElement] = React.useState<HTMLElement | null>(null);
  const [hasSubmenuOpen, setHasSubmenuOpen] = React.useState(false);

  useScrollLock({
    enabled: modal && hasSubmenuOpen,
    open: hasSubmenuOpen,
    mounted: hasSubmenuOpen,
    referenceElement: contentElement,
  });

  const state = React.useMemo(
    () => ({
      orientation,
      modal,
    }),
    [orientation, modal],
  );

  const contentRef = React.useRef<HTMLDivElement>(null);
  const allowMouseUpTriggerRef = React.useRef(false);

  const element = useRenderElement('div', props, {
    state,
    props: [{ role: 'menubar' }, otherProps],
    ref: [forwardedRef, setContentElement, contentRef],
  });

  const context: MenubarContext = React.useMemo(
    () => ({
      contentElement,
      setContentElement,
      setHasSubmenuOpen,
      hasSubmenuOpen,
      modal,
      orientation,
      allowMouseUpTriggerRef,
    }),
    [contentElement, hasSubmenuOpen, modal, orientation],
  );

  return (
    <MenubarContext.Provider value={context}>
      <FloatingTree>
        <MenubarContent>
          <CompositeRoot
            render={element}
            orientation={orientation}
            loop={loop}
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
  const openSubmenusRef = React.useRef(new Set<string>());
  const rootContext = useMenubarContext();

  React.useEffect(() => {
    function onSubmenuOpenChange(event: { open: boolean; nodeId: string; parentNodeId: string }) {
      if (event.parentNodeId !== nodeId) {
        return;
      }

      if (event.open) {
        openSubmenusRef.current.add(event.nodeId);
      } else {
        openSubmenusRef.current.delete(event.nodeId);
      }

      const isAnyOpen = openSubmenusRef.current.size > 0;
      if (isAnyOpen) {
        rootContext.setHasSubmenuOpen(true);
      } else if (rootContext.hasSubmenuOpen) {
        // wait for the next frame to set the state to make sure another menu doesn't open
        // immediately after the previous one is closed
        AnimationFrame.request(() => {
          if (openSubmenusRef.current.size === 0) {
            rootContext.setHasSubmenuOpen(false);
          }
        });
      }
    }

    menuEvents.on('openchange', onSubmenuOpenChange);

    return () => {
      menuEvents.off('openchange', onSubmenuOpenChange);
    };
  }, [menuEvents, nodeId, rootContext]);

  return <FloatingNode id={nodeId}>{props.children}</FloatingNode>;
}

export namespace Menubar {
  export interface State {}
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the menubar is modal.
     * @default true
     */
    modal?: boolean;
    /**
     * Whether the whole menubar is disabled.
     * @default false
     */
    disabled?: boolean;
    /**
     * The orientation of the menubar.
     * @default 'horizontal'
     */
    orientation?: MenuOrientation;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     * @default true
     */
    loop?: boolean;
  }
}
