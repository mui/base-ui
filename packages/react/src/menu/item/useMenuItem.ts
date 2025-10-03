'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import { FloatingEvents } from '../../floating-ui-react';
import { useButton } from '../../use-button';
import { mergeProps } from '../../merge-props';
import { HTMLProps, BaseUIEvent } from '../../utils/types';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';

export const REGULAR_ITEM = {
  type: 'regular-item' as const,
};

export function useMenuItem(params: useMenuItem.Parameters): useMenuItem.ReturnValue {
  const {
    closeOnClick,
    disabled = false,
    highlighted,
    id,
    menuEvents,
    allowMouseUpTriggerRef,
    typingRef,
    nativeButton,
    itemMetadata,
    nodeId,
  } = params;

  const itemRef = React.useRef<HTMLElement | null>(null);
  const contextMenuContext = useContextMenuRootContext(true);
  const isContextMenu = contextMenuContext !== undefined;

  const { getButtonProps, buttonRef } = useButton({
    disabled,
    focusableWhenDisabled: true,
    native: nativeButton,
  });

  const getItemProps = React.useCallback(
    (externalProps?: HTMLProps): HTMLProps => {
      return mergeProps<'div'>(
        {
          id,
          role: 'menuitem',
          tabIndex: highlighted ? 0 : -1,
          onMouseMove(event) {
            if (!nodeId) {
              return;
            }

            // Inform the floating tree that a menu item within this menu was hovered/moved over
            // so unrelated descendant submenus can be closed.
            menuEvents.emit('itemhover', {
              nodeId,
              target: event.currentTarget,
            });
          },
          onMouseEnter() {
            if (itemMetadata.type !== 'submenu-trigger') {
              return;
            }

            itemMetadata.setActive();
          },
          onKeyUp(event: BaseUIEvent<React.KeyboardEvent>) {
            if (event.key === ' ' && typingRef.current) {
              event.preventBaseUIHandler();
            }
          },
          onClick(event) {
            if (closeOnClick) {
              menuEvents.emit('close', { domEvent: event, reason: 'item-press' });
            }
          },
          onMouseUp(event) {
            if (
              itemRef.current &&
              allowMouseUpTriggerRef.current &&
              (!isContextMenu || event.button === 2)
            ) {
              // This fires whenever the user clicks on the trigger, moves the cursor, and releases it over the item.
              // We trigger the click and override the `closeOnClick` preference to always close the menu.
              if (itemMetadata.type === 'regular-item') {
                itemRef.current.click();
              }
            }
          },
        },
        externalProps,
        getButtonProps,
      );
    },
    [
      id,
      highlighted,
      getButtonProps,
      typingRef,
      closeOnClick,
      menuEvents,
      allowMouseUpTriggerRef,
      isContextMenu,
      itemMetadata,
      nodeId,
    ],
  );

  const mergedRef = useMergedRefs(itemRef, buttonRef);

  return React.useMemo(
    () => ({
      getItemProps,
      itemRef: mergedRef,
    }),
    [getItemProps, mergedRef],
  );
}

export interface useMenuItemParameters {
  /**
   * Whether to close the menu when the item is clicked.
   */
  closeOnClick: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Determines if the menu item is highlighted.
   */
  highlighted: boolean;
  /**
   * The id of the menu item.
   */
  id: string | undefined;
  /**
   * The FloatingEvents instance of the menu's root.
   */
  menuEvents: FloatingEvents;
  /**
   * Whether to treat mouseup events as clicks.
   */
  allowMouseUpTriggerRef: React.RefObject<boolean>;
  /**
   * A ref that is set to `true` when the user is using the typeahead feature.
   */
  typingRef: React.RefObject<boolean>;
  /**
   * Whether the component renders a native `<button>` element when replacing it
   * via the `render` prop.
   * Set to `false` if the rendered element is not a button (e.g. `<div>`).
   * @default false
   */
  nativeButton: boolean;
  /**
   * Additional data specific to the item type.
   */
  itemMetadata: useMenuItem.Metadata;
  /**
   * The node id of the menu positioner.
   */
  nodeId: string | undefined;
}

export type useMenuItemMetadata =
  | typeof REGULAR_ITEM
  | {
      type: 'submenu-trigger';
      setActive: () => void;
      allowMouseEnterEnabled: boolean;
    };

export interface useMenuItemReturnValue {
  /**
   * Resolver for the root slot's props.
   * @param externalProps event handlers for the root slot
   * @returns props that should be spread on the root slot
   */
  getItemProps: (externalProps?: HTMLProps) => HTMLProps;
  /**
   * The ref to the component's root DOM element.
   */
  itemRef: React.RefCallback<Element> | null;
}

export namespace useMenuItem {
  export type Parameters = useMenuItemParameters;
  export type Metadata = useMenuItemMetadata;
  export type ReturnValue = useMenuItemReturnValue;
}
