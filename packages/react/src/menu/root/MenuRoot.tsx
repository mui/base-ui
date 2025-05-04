'use client';
import * as React from 'react';
import { FloatingTree } from '@floating-ui/react';
import { useDirection } from '../../direction-provider/DirectionContext';
import { MenuRootContext, useMenuRootContext } from './MenuRootContext';
import { MenuOrientation, MenuOpenChangeReason, useMenuRoot } from './useMenuRoot';

/**
 * Groups all parts of the menu.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuRoot: React.FC<MenuRoot.Props> = function MenuRoot(props) {
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
    actionsRef,
    onOpenChangeComplete,
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
    actionsRef,
    onOpenChangeComplete,
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

export namespace MenuRoot {
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
     * Determines if the menu enters a modal state when open.
     * - `true`: user interaction is limited to the menu: document page scroll is locked and and pointer interactions on outside elements are disabled.
     * - `false`: user interaction with the rest of the document is allowed.
     * @default true
     */
    modal?: boolean;
    /**
     * Event handler called when the menu is opened or closed.
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: MenuOpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the menu is closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
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
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the menu will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the menu manually.
     * Useful when the menu's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<{ unmount: () => void }>;
  }

  export interface Actions {
    unmount: () => void;
  }

  export type OpenChangeReason = MenuOpenChangeReason;
}
