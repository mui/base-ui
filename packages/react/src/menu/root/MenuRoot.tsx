'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingTree } from '@floating-ui/react';
import { useDirection } from '../../direction-provider/DirectionContext';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { MenuOrientation, useMenuRoot } from './useMenuRoot';
import { PortalContext } from '../../portal/PortalContext';

const inertStyle = `
  [data-floating-ui-inert] {
    pointer-events: none !important;
  }
`;

/**
 * Groups all parts of the menu.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuRoot: React.FC<MenuRoot.Props> = function MenuRoot(props) {
  const {
    children,
    defaultOpen = false,
    disabled = false,
    closeParentOnEsc = true,
    loop = true,
    modal = true,
    onOpenChange,
    open,
    orientation = 'vertical',
    delay = 100,
    openOnHover: openOnHoverProp,
  } = props;

  const direction = useDirection();

  const parentContext = useMenuRootContext(true);
  const nested = parentContext != null;

  const openOnHover = openOnHoverProp ?? nested;
  const typingRef = React.useRef(false);

  const onTypingChange = React.useCallback((nextTyping: boolean) => {
    typingRef.current = nextTyping;
  }, []);

  const menuRoot = useMenuRoot({
    direction,
    disabled,
    closeParentOnEsc,
    onOpenChange,
    loop,
    defaultOpen,
    open,
    orientation,
    nested,
    openOnHover,
    delay,
    onTypingChange,
    modal,
  });

  const context: MenuRootContext = React.useMemo(
    () => ({
      ...menuRoot,
      nested,
      parentContext,
      disabled,
      allowMouseUpTriggerRef:
        parentContext?.allowMouseUpTriggerRef ?? menuRoot.allowMouseUpTriggerRef,
      typingRef,
      modal,
    }),
    [menuRoot, nested, parentContext, disabled, modal],
  );

  if (!nested) {
    // set up a FloatingTree to provide the context to nested menus
    return (
      <FloatingTree>
        {/* eslint-disable-next-line react/no-danger */}
        {menuRoot.open && modal && <style dangerouslySetInnerHTML={{ __html: inertStyle }} />}
        <MenuRootContext.Provider value={context}>
          <PortalContext.Provider value={context.mounted}>{children}</PortalContext.Provider>
        </MenuRootContext.Provider>
      </FloatingTree>
    );
  }

  return (
    <MenuRootContext.Provider value={context}>
      <PortalContext.Provider value={context.mounted}>{children}</PortalContext.Provider>
    </MenuRootContext.Provider>
  );
};

namespace MenuRoot {
  export interface Props {
    children: React.ReactNode;
    /**
     * Whether the menu is initially open.
     *
     * To render a controlled menu, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Whether to loop keyboard focus back to the first item
     * when the end of the list is reached while using the arrow keys.
     * @default true
     */
    loop?: boolean;
    /**
     * Whether the menu is modal.
     * @default true
     */
    modal?: boolean;
    /**
     * Event handler called when the menu is opened or closed.
     */
    onOpenChange?: (open: boolean, event?: Event) => void;
    /**
     * Whether the menu is currently open.
     */
    open?: boolean;
    /**
     * The visual orientation of the menu.
     * Controls whether roving focus uses up/down or left/right arrow keys.
     * @default 'vertical'
     */
    orientation?: MenuOrientation;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * When in a submenu, determines whether pressing the Escape key
     * closes the entire menu, or only the current child menu.
     * @default true
     */
    closeParentOnEsc?: boolean;
    /**
     * How long to wait before the menu may be opened on hover. Specified in milliseconds.
     *
     * Requires the `openOnHover` prop.
     * @default 100
     */
    delay?: number;
    /**
     * Whether the menu should also open when the trigger is hovered.
     *
     * Defaults to `true` for nested menus.
     */
    openOnHover?: boolean;
  }
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
   * When in a submenu, determines whether pressing the Escape key
   * closes the entire menu, or only the current child menu.
   * @default true
   */
  closeParentOnEsc: PropTypes.bool,
  /**
   * Whether the menu is initially open.
   *
   * To render a controlled menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * How long to wait before the menu may be opened on hover. Specified in milliseconds.
   *
   * Requires the `openOnHover` prop.
   * @default 100
   */
  delay: PropTypes.number,
  /**
   * Whether the component should ignore user interaction.
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
   * Whether the menu is modal.
   * @default true
   */
  modal: PropTypes.bool,
  /**
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Whether the menu is currently open.
   */
  open: PropTypes.bool,
  /**
   * Whether the menu should also open when the trigger is hovered.
   *
   * Defaults to `true` for nested menus.
   */
  openOnHover: PropTypes.bool,
  /**
   * The visual orientation of the menu.
   * Controls whether roving focus uses up/down or left/right arrow keys.
   * @default 'vertical'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
} as any;

export { MenuRoot };
