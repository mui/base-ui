'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingTree } from '@floating-ui/react';
import { useDirection } from '../../direction-provider/DirectionContext';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { MenuOrientation, useMenuRoot } from './useMenuRoot';
import { PortalContext } from '../../portal/PortalContext';

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
      typingRef,
    }),
    [menuRoot, nested, parentContext, disabled, clickAndDragEnabled, setClickAndDragEnabled],
  );

  if (!nested) {
    // set up a FloatingTree to provide the context to nested menus
    return (
      <FloatingTree>
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
     * Event handler called when the dialog is opened or closed.
     */
    onOpenChange?: (open: boolean, event?: Event) => void;
    /**
     * Whether the menu is currently open.
     */
    open?: boolean;
    /**
     * The orientation of the Menu (horizontal or vertical).
     *
     * @default 'vertical'
     */
    orientation?: MenuOrientation;
    /**
     * Whether the component should ignore user actions.
     * @default false
     */
    disabled?: boolean;
    /**
     * Determines if pressing the Esc key closes the parent menus.
     * This is only applicable for nested menus.
     *
     * If set to `false` pressing Esc closes only the current menu.
     *
     * @default true
     */
    closeParentOnEsc?: boolean;
    /**
     * The delay in milliseconds until the menu popup is opened when `openOnHover` is `true`.
     *
     * @default 100
     */
    delay?: number;
    /**
     * Whether the menu popup opens when the trigger is hovered after the provided `delay`.
     * By default, `openOnHover` is set to `true` for nested menus.
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
   * Determines if pressing the Esc key closes the parent menus.
   * This is only applicable for nested menus.
   *
   * If set to `false` pressing Esc closes only the current menu.
   *
   * @default true
   */
  closeParentOnEsc: PropTypes.bool,
  /**
   * Whether the menu is initially open.
   * To render a controlled menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * The delay in milliseconds until the menu popup is opened when `openOnHover` is `true`.
   *
   * @default 100
   */
  delay: PropTypes.number,
  /**
   * Whether the component should ignore user actions.
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
   * Event handler called when the menu is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Whether the menu is currently open.
   */
  open: PropTypes.bool,
  /**
   * Whether the menu popup opens when the trigger is hovered after the provided `delay`.
   * By default, `openOnHover` is set to `true` for nested menus.
   */
  openOnHover: PropTypes.bool,
  /**
   * The orientation of the Menu (horizontal or vertical).
   *
   * @default 'vertical'
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
} as any;

export { MenuRoot };
