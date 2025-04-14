import * as React from 'react';
import PropTypes from 'prop-types';
import {
  Composite,
  FloatingNode,
  FloatingTree,
  useFloatingNodeId,
  useFloatingTree,
} from '@floating-ui/react';
import { MenuOrientation } from '../../menu/root/useMenuRoot';
import { BaseUIComponentProps } from '../../utils/types';
import { MenubarRootContext, useMenubarRootContext } from './MenubarRootContext';
import { useForkRef, useScrollLock } from '../../utils';
import { useComponentRenderer } from '../../utils/useComponentRenderer';

/**
 * The container for menus.
 *
 * Documentation: [Base UI Menubar](https://base-ui.com/react/components/menubar)
 */
const MenubarRoot = React.forwardRef(function MenubarRoot(
  props: MenubarRoot.Props,
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

  const mergedRef = useForkRef(forwardedRef, setContentElement);

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

  const { renderElement } = useComponentRenderer({
    render: render ?? 'div',
    className,
    state,
    extraProps: otherProps,
  });

  const context = React.useMemo(
    () => ({
      contentElement,
      setContentElement,
      hasSubmenuOpen,
      setHasSubmenuOpen,
      modal,
    }),
    [contentElement, hasSubmenuOpen, modal],
  );

  return (
    <MenubarRootContext.Provider value={context}>
      <FloatingTree>
        <MenubarContent>
          <Composite
            render={renderElement()}
            orientation={orientation}
            loop={loop}
            ref={mergedRef}
          />
        </MenubarContent>
      </FloatingTree>
    </MenubarRootContext.Provider>
  );
});

MenubarRoot.propTypes /* remove-proptypes */ = {
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
  const rootContext = useMenubarRootContext();
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

      rootContext.setHasSubmenuOpen(openSubmenus.current.size > 0);
    }

    menuEvents.on('openchange', onSubmenuOpenChange);

    return () => {
      menuEvents.off('openchange', onSubmenuOpenChange);
    };
  }, [menuEvents, nodeId, rootContext]);

  return <FloatingNode id={nodeId}>{props.children}</FloatingNode>;
}

namespace MenubarRoot {
  export interface State {}
  export interface Props extends BaseUIComponentProps<'div', State> {
    /**
     * Whether the menubar is modal.
     * @default true
     */
    modal?: boolean;
    /**
     * Whether the whole menubar is disabled.
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

export { MenubarRoot };
