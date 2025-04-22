'use client';

import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingNode, FloatingTree, useFloatingNodeId, useFloatingTree } from '@floating-ui/react';
import { MenuOrientation } from '../menu/root/useMenuRoot';
import { BaseUIComponentProps } from '../utils/types';
import { MenubarContext, useMenubarContext } from './MenubarContext';
import { useScrollLock } from '../utils';
import { CompositeRoot } from '../composite/root/CompositeRoot';
import { useRenderElement } from '../utils/useRenderElement';
import { useEventCallback } from '../utils/useEventCallback';
import { ownerDocument } from '../utils/owner';

/**
 * The container for menus.
 *
 * Documentation: [Base UI Menubar](https://base-ui.com/react/components/menubar)
 */
const Menubar = React.forwardRef(function Menubar(
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
  const [hasFocusWithin, setHasFocusWithin] = React.useState(false);

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

  const handleFocus = React.useCallback(() => {
    setHasFocusWithin(true);
  }, []);

  const handleBlur = useEventCallback((event: React.FocusEvent) => {
    if (!contentElement || !contentElement.contains(event.relatedTarget as Node)) {
      setHasFocusWithin(false);
    }
  });

  const renderElement = useRenderElement('div', props, {
    state,
    props: [otherProps, { onFocus: handleFocus, onBlur: handleBlur, role: 'menubar' }],
    ref: [forwardedRef, setContentElement, contentRef],
  });

  const shouldOpenOnHover = hasSubmenuOpen || hasFocusWithin;

  const context: MenubarContext = React.useMemo(
    () => ({
      contentElement,
      setContentElement,
      setHasSubmenuOpen,
      hasSubmenuOpen,
      shouldOpenOnHover,
      modal,
      orientation,
    }),
    [contentElement, shouldOpenOnHover, hasSubmenuOpen, modal, orientation],
  );

  return (
    <MenubarContext.Provider value={context}>
      <FloatingTree>
        <MenubarContent>
          <CompositeRoot
            render={renderElement()}
            orientation={orientation}
            loop={loop}
            highlightItemOnHover={shouldOpenOnHover}
          />
        </MenubarContent>
      </FloatingTree>
    </MenubarContext.Provider>
  );
});

Menubar.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * CSS class applied to the element, or a function that
   * returns a class based on the component’s state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * Whether the whole menubar is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Whether to loop keyboard focus back to the first item
   * when the end of the list is reached while using the arrow keys.
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * Whether the menubar is modal.
   * @default true
   */
  modal: PropTypes.bool,
  /**
   * The orientation of the menubar.
   * @default 'horizontal'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  /**
   * Allows you to replace the component’s HTML element
   * with a different tag, or compose it with another component.
   *
   * Accepts a `ReactElement` or a function that returns the element to render.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
} as any;

function MenubarContent(props: React.PropsWithChildren<{}>) {
  const nodeId = useFloatingNodeId();
  const { events: menuEvents } = useFloatingTree()!;
  const openSubmenus = React.useRef(new Set<string>());
  const rootContext = useMenubarContext();
  React.useEffect(() => {
    function onSubmenuOpenChange(event: { open: boolean; nodeId: string; parentNodeId: string }) {
      if (event.parentNodeId !== nodeId) {
        return;
      }

      if (event.open) {
        openSubmenus.current.add(event.nodeId);
      } else {
        openSubmenus.current.delete(event.nodeId);
      }

      const isAnyOpen = openSubmenus.current.size > 0;
      if (isAnyOpen) {
        rootContext.setHasSubmenuOpen(true);
      } else if (rootContext.hasSubmenuOpen) {
        // wait for the next frame to set the state to make sure another menu doesn't open
        // immediately after the previous one is closed
        requestAnimationFrame(() => {
          if (openSubmenus.current.size === 0) {
            rootContext.setHasSubmenuOpen(false);
            ownerDocument(rootContext.contentElement).body.focus();
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

namespace Menubar {
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

MenubarContent.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * @ignore
   */
  children: PropTypes.node,
} as any;

export { Menubar };
