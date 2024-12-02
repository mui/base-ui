'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingTree } from '@floating-ui/react';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { MenuOrientation, useMenuRoot } from './useMenuRoot';
import { type TextDirection } from '../../utils/getTextDirection';

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
    animated = true,
    children,
    defaultOpen = false,
    dir = null,
    disabled = false,
    closeParentOnEsc = true,
    loop = true,
    onOpenChange,
    open,
    orientation = 'vertical',
    delay = 100,
    openOnHover: openOnHoverProp,
  } = props;

  const parentContext = useMenuRootContext(true);
  const nested = parentContext != null;

  const openOnHover = openOnHoverProp ?? nested;
  const typingRef = React.useRef(false);

  const onTypingChange = React.useCallback((nextTyping: boolean) => {
    typingRef.current = nextTyping;
  }, []);

  const menuRoot = useMenuRoot({
    animated,
    dir,
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
        <MenuRootContext.Provider value={context}>{children}</MenuRootContext.Provider>
      </FloatingTree>
    );
  }

  return <MenuRootContext.Provider value={context}>{children}</MenuRootContext.Provider>;
};

namespace MenuRoot {
  export interface Props {
    /**
     * If `true`, the Menu supports CSS-based animations and transitions.
     * It is kept in the DOM until the animation completes.
     *
     * @default true
     */
    animated?: boolean;
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
     * The direction of the Menu (left-to-right or right-to-left).
     * When `null`, the direction is detected and arrow key navigation
     * will adapt automatically.
     * @default null
     */
    dir?: TextDirection | null;
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
   * If `true`, the Menu supports CSS-based animations and transitions.
   * It is kept in the DOM until the animation completes.
   *
   * @default true
   */
  animated: PropTypes.bool,
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
   * The direction of the Menu (left-to-right or right-to-left).
   *
   * @default null
   */
  dir: PropTypes.oneOf(['ltr', 'rtl', null]),
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
