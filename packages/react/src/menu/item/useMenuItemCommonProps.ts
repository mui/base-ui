'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import type { HTMLProps } from '../../internals/types';
import type { MenuStore } from '../store/MenuStore';
import { REASONS } from '../../internals/reasons';
import { useContextMenuRootContext } from '../../context-menu/root/ContextMenuRootContext';
import { useMenuRootContext } from '../root/MenuRootContext';
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
}

/**
 * Returns common props shared by all menu item types.
 * This hook extracts the shared logic for id, role, tabIndex, and interaction handlers.
 */
export function useMenuItemCommonProps(params: UseMenuItemCommonPropsParameters): HTMLProps {
  const { closeOnClick, highlighted, id, nodeId, store, typingRef, itemRef, itemMetadata } = params;

  const rootContext = useMenuRootContext();
  const contextMenuContext = useContextMenuRootContext(true);

  // A submenu trigger is an item of the parent menu's list, so it follows that list's focus model.
  const isSubmenuTrigger = itemMetadata.type === 'submenu-trigger';
  const virtualFocus = isSubmenuTrigger ? rootContext.parentVirtualFocus : rootContext.virtualFocus;
  const selectionStore =
    isSubmenuTrigger && rootContext.parent.type === 'menu'
      ? rootContext.parent.store
      : rootContext.store;
  const ariaSelected = selectionStore.useState('webkitAriaSelected', highlighted);

  const { events: menuEvents } = store.useState('floatingTreeRoot');
  const open = store.useState('open');

  const isContextMenu = contextMenuContext !== undefined;
  // `-1` rather than omitting it, which leaves links and buttons in the tab order.
  const tabIndex = !virtualFocus && open && highlighted ? 0 : -1;

  return React.useMemo(
    () => ({
      id,
      role: 'menuitem' as const,
      tabIndex,
      'aria-selected': ariaSelected,
      onMouseDown(event: React.MouseEvent) {
        const isNativeButton = event.currentTarget.tagName === 'BUTTON';
        const shouldFocusNativeButton =
          platform.engine.webkit && isNativeButton && event.button === 0 && !event.defaultPrevented;

        // Real focus stays on the input or list that owns virtual navigation.
        if (virtualFocus) {
          event.preventDefault();
        } else if (shouldFocusNativeButton) {
          // Safari 16 does not mouse-focus buttons even with an explicit tabIndex.
          // Prevent its default blur before focusing, so focus survives until click.
          event.preventDefault();
          itemRef.current?.focus({ preventScroll: true });
        }
      },
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
          menuEvents.emit('close', { domEvent: event.nativeEvent, reason: REASONS.itemPress });
        }
      },
      onMouseUp(event: React.MouseEvent) {
        if (contextMenuContext) {
          const initialCursorPoint = contextMenuContext.initialCursorPointRef.current;
          contextMenuContext.initialCursorPointRef.current = null;
          const isInitialContextMenuMouseUp =
            isContextMenu &&
            initialCursorPoint &&
            Math.abs(event.clientX - initialCursorPoint.x) <= 1 &&
            Math.abs(event.clientY - initialCursorPoint.y) <= 1;
          if (isInitialContextMenuMouseUp) {
            return;
          }

          // On non-macOS platforms, this mouseup belongs to the right-click gesture
          // that opened the context menu, so it must not activate an item.
          if (isContextMenu && !platform.os.mac && event.button === 2) {
            return;
          }
        }

        const isRegularItem = itemMetadata.type === 'regular-item';
        const isDragRelease =
          store.context.allowMouseUpTriggerRef.current && (!isContextMenu || event.button === 2);
        if (itemRef.current && isRegularItem && isDragRelease) {
          // The press started on the trigger and was released over the item, so the item
          // needs a synthetic click. Its `closeOnClick` preference still applies.
          // Drag release has no mousedown on this item. Focus it before activation so
          // arrow navigation continues from it when the menu stays open.
          if (!virtualFocus) {
            itemRef.current.focus({ preventScroll: true });
          }
          // `detail: 1` and `pointerType: 'mouse'` mark this as a mouse-gesture click so
          // MenuRoot and FloatingFocusManager don't treat it as a keyboard activation.
          dispatchClickWithModifiers(itemRef.current, event, {
            detail: 1,
            pointerType: 'mouse',
          });
        }
      },
    }),
    [
      closeOnClick,
      tabIndex,
      id,
      menuEvents,
      nodeId,
      store.context.allowMouseUpTriggerRef,
      typingRef,
      itemRef,
      contextMenuContext,
      isContextMenu,
      itemMetadata.type,
      ariaSelected,
      virtualFocus,
    ],
  );
}

export interface UseMenuItemCommonPropsState {}
