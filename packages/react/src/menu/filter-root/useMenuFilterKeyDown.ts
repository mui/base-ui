'use client';
import type * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { stopEvent } from '../../utils/popups/event';
import { getMaxListIndex, getMinListIndex } from '../../internals/composite/listIndex';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import { isMainOrientationKey } from '../../utils/popups/interactions/useListNavigation';
import { getFilterKeyAction } from '../../filter-dropdown/utils/getFilterKeyAction';

/**
 * Routes keys for a filterable menu's input, which holds real focus while the list is navigated
 * with `aria-activedescendant`. Keys reaching the input, and those an item that received real
 * focus from assistive technology hands back, go through here; the trigger relays only the
 * vertical arrows while the popup is open. Navigation runs the menu's own `useListNavigation`
 * handler directly.
 */
export function useMenuFilterKeyDown(hasValue: boolean) {
  const { orientation, store } = useMenuRootContext();
  const submenuContext = useMenuSubmenuRootContext();
  const direction = useDirection();

  return useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    // Like a plain menu, ignore keys while the popup animates out with the input still focused.
    if (!store.select('open')) {
      return;
    }
    const activeItem = store.state.highlightedItem;
    const action = getFilterKeyAction(event, {
      orientation,
      rtl: direction === 'rtl',
      hasActiveItem: activeItem != null,
      activeItemOpensSubmenu: activeItem?.hasAttribute('aria-haspopup') ?? false,
      hasValue,
    });

    switch (action) {
      case 'edit':
        event.stopPropagation();
        // Typing ends pointer modality, as it does in a combobox, so a result change that moves
        // the highlighted item out from under a resting pointer doesn't clear the highlight.
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          store.state.inputProps.onKeyDown?.(event as React.KeyboardEvent<any>);
        }
        break;
      case 'navigate': {
        if (isMainOrientationKey(event.key, orientation)) {
          // Keep the same event from reaching the popup's list navigation and moving the virtual
          // cursor a second time.
          event.stopPropagation();
        }
        store.state.inputProps.onKeyDown?.(event as React.KeyboardEvent<any>);
        break;
      }
      case 'enter-list': {
        event.stopPropagation();
        const listRef = store.context.itemDomElements;
        const index =
          event.key === 'ArrowDown'
            ? getMinListIndex(listRef, EMPTY_ARRAY)
            : getMaxListIndex(listRef, EMPTY_ARRAY);
        if (listRef.current[index]) {
          event.preventDefault();
          store.setActiveIndex(index, REASONS.keyboard, event.nativeEvent);
        }
        break;
      }
      case 'submenu': {
        // The highlighted item's own handlers decide, since opening depends on the item and on
        // both menus' orientations, and they read `currentTarget`, so the key is dispatched on
        // it. Its propagation reaches the popup, which closes a submenu.
        stopEvent(event);
        const KeyboardEventConstructor = ownerWindow(activeItem).KeyboardEvent;
        activeItem!.dispatchEvent(new KeyboardEventConstructor(event.type, event.nativeEvent));
        break;
      }
      case 'activate':
        event.preventDefault();
        dispatchClickWithModifiers(activeItem!, event);
        break;
      case 'close': {
        // Mirror the plain menu: Shift+Tab closes the popup and returns focus. A submenu returns
        // to the element that held focus in its parent, which is the parent's input rather than
        // its untabbable trigger when the parent is filterable too.
        stopEvent(event);
        const returnElement =
          (store.state.parent.type === 'menu' && submenuContext?.getReturnElement?.()) ||
          store.state.activeTriggerElement;
        const details = createChangeEventDetails(REASONS.focusOut, event.nativeEvent);
        store.setOpen(false, details);
        if (!details.isCanceled && isHTMLElement(returnElement)) {
          returnElement.focus();
        }
        break;
      }
      default:
        break;
    }
  });
}
