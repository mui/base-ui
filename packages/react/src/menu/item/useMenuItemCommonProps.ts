'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { HTMLProps } from '../../internals/types';
import { MenuStore } from '../store/MenuStore';
import { REASONS } from '../../internals/reasons';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import type { UseMenuItemMetadata } from './useMenuItem';

export interface UseMenuItemCommonPropsParameters {
  /**
   * Whether to close the menu when the item is clicked.
   */
  closeOnClick: boolean;
  /**
   * Determines if the menu item is highlighted.
   */
  highlighted: boolean;
  /**
   * The id of the menu item.
   */
  id: string | undefined;
  /**
   * The node id of the menu positioner.
   */
  nodeId: string | undefined;
  /**
   * The menu store.
   */
  store: MenuStore<any>;
  /**
   * Whether the list containing the item is open.
   */
  open: boolean;
  /**
   * Whether a typeahead session is in progress.
   */
  typingRef?: React.RefObject<boolean> | undefined;
  /**
   * Ref to the item element.
   */
  itemRef: React.RefObject<HTMLElement | null>;
  /**
   * Metadata for checking item type before triggering click.
   */
  itemMetadata: UseMenuItemMetadata;
  /**
   * Whether the containing list uses virtual focus.
   * @default false
   */
  virtualFocus?: boolean | undefined;
}

/**
 * Returns common props shared by all menu item types.
 * This hook extracts the shared logic for id, role, tabIndex, onKeyDown,
 * onMouseMove, onClick, and onMouseUp handlers.
 */
export function useMenuItemCommonProps(params: UseMenuItemCommonPropsParameters): HTMLProps {
  const {
    closeOnClick,
    highlighted,
    id,
    nodeId,
    open,
    store,
    typingRef,
    itemRef,
    itemMetadata,
    virtualFocus = false,
  } = params;

  const { events: menuEvents } = store.useState('floatingTreeRoot');
  const contextMenuContext = useContextMenuRootContext(true);
  const isContextMenu = contextMenuContext !== undefined;
  // `-1` rather than omitting it, which leaves links and buttons in the tab order.
  let tabIndex = -1;
  if (!virtualFocus && open && highlighted) {
    tabIndex = 0;
  }

  // WebKit's accessibility tree only follows a searchbox's `aria-activedescendant` into a menu
  // when the items expose a selection state. `aria-selected` is not valid on `menuitem`, so it is
  // scoped to the engine whose VoiceOver support needs it.
  const ariaSelected =
    virtualFocus && platform.engine.webkit ? (highlighted as boolean) : undefined;

  return React.useMemo(
    () => ({
      id,
      role: 'menuitem' as const,
      tabIndex,
      'aria-selected': ariaSelected,
      onKeyDown(event: React.KeyboardEvent) {
        if (event.key === ' ' && typingRef?.current) {
          event.preventDefault();
        }
      },
      onMouseMove(event: React.MouseEvent) {
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
      onClick(event: React.MouseEvent) {
        if (closeOnClick) {
          menuEvents.emit('close', { domEvent: event, reason: REASONS.itemPress });
        }
      },
      onMouseUp(event: React.MouseEvent) {
        if (contextMenuContext) {
          const initialCursorPoint = contextMenuContext.initialCursorPointRef.current;
          contextMenuContext.initialCursorPointRef.current = null;
          if (
            isContextMenu &&
            initialCursorPoint &&
            Math.abs(event.clientX - initialCursorPoint.x) <= 1 &&
            Math.abs(event.clientY - initialCursorPoint.y) <= 1
          ) {
            return;
          }

          // On non-macOS platforms, this mouseup belongs to the right-click gesture
          // that opened the context menu, so it must not activate an item.
          if (isContextMenu && !platform.os.mac && event.button === 2) {
            return;
          }
        }

        if (
          itemRef.current &&
          store.context.allowMouseUpTriggerRef.current &&
          (!isContextMenu || event.button === 2)
        ) {
          // This fires whenever the user clicks on the trigger, moves the cursor, and releases it over the item.
          // We trigger the click and override the `closeOnClick` preference to always close the menu.
          if (itemMetadata.type === 'regular-item') {
            // `detail: 1` marks this as a mouse-gesture click so MenuRoot doesn't
            // treat it as a keyboard activation (`detail === 0` → `data-instant`).
            dispatchClickWithModifiers(itemRef.current, event, { detail: 1 });
          }
        }
      },
    }),
    [
      id,
      tabIndex,
      ariaSelected,
      typingRef,
      nodeId,
      menuEvents,
      closeOnClick,
      contextMenuContext,
      itemRef,
      store.context.allowMouseUpTriggerRef,
      isContextMenu,
      itemMetadata.type,
    ],
  );
}

export interface UseMenuItemCommonPropsState {}
