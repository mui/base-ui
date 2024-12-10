'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingTree } from '@floating-ui/react';
import { useDirection } from '../../direction-provider/DirectionContext';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { MenuOrientation, useMenuRoot } from './useMenuRoot';

/**
 *
 * Demos:
 *
 * - [Menu](https://base-ui.com/components/react-menu/)
 *
 * API:
 *
 * - [MenuRoot API](https://base-ui.com/components/react-menu/#api-reference-MenuRoot)
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
        <MenuRootContext.Provider value={context}>{children}</MenuRootContext.Provider>
      </FloatingTree>
    );
  }

  return <MenuRootContext.Provider value={context}>{children}</MenuRootContext.Provider>;
};

namespace MenuRoot {
  export interface Props {
    children: React.ReactNode;
    /**
     * If `true`, the Menu is initially open.
     *
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
     * @default true
     */
    loop?: boolean;
    /**
     * Determines whether the menu is modal.
     * @default true
     */
    modal?: boolean;
    /**
     * Callback fired when the component requests to be opened or closed.
     */
    onOpenChange?: (open: boolean, event?: Event) => void;
    /**
     * Allows to control whether the dropdown is open.
     * This is a controlled counterpart of `defaultOpen`.
     */
    open?: boolean;
    /**
     * The orientation of the Menu (horizontal or vertical).
     *
     * @default 'vertical'
     */
    orientation?: MenuOrientation;
    /**
     * If `true`, the Menu is disabled.
     *
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
   * If `true`, the Menu is initially open.
   *
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
   * If `true`, the Menu is disabled.
   *
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, using keyboard navigation will wrap focus to the other end of the list once the end is reached.
   * @default true
   */
  loop: PropTypes.bool,
  /**
   * Determines whether the menu is modal.
   * @default true
   */
  modal: PropTypes.bool,
  /**
   * Callback fired when the component requests to be opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Allows to control whether the dropdown is open.
   * This is a controlled counterpart of `defaultOpen`.
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
