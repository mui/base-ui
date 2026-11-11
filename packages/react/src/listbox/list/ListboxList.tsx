'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { ownerDocument } from '@base-ui/utils/owner';
import { activeElement, contains } from '@base-ui/utils/shadowDom';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useDirection } from '../../internals/direction-context';
import { TYPEAHEAD_RESET_MS } from '../../internals/constants';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import { stopEvent } from '../../utils/popups/event';
import { useTypeahead } from '../../utils/popups/interactions/useTypeahead';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { resolveListKeyCommand } from '../utils/listKeyCommand';
import type { ListKeyCommand } from '../utils/listKeyCommand';

/**
 * A container for the listbox items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Listbox](https://base-ui.com/react/components/listbox)
 */
export const ListboxList = React.forwardRef(function ListboxList(
  componentProps: ListboxList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, ...elementProps } = componentProps;

  const store = useListboxRootContext();

  const id = store.useState('id');
  const labelId = store.useState('labelId');
  const activeIndex = store.useState('activeIndex');
  const orientation = store.useState('orientation');
  const disabled = store.useState('disabled');
  const multiple = store.useState('multiple');
  const items = store.useState('items');
  // With `items`, the list knows every item, including those that aren't rendered.
  const itemCount = items?.size;
  const activeItemRendered = store.useState('activeItemRendered');
  const direction = useDirection();
  const { elementsRef, labelsRef, typingRef } = store.context;

  // Where a Shift+Arrow range starts: the item focused when Shift was pressed.
  const shiftAnchorRef = React.useRef<number | null>(null);

  const runKeyCommand = useStableCallback((command: ListKeyCommand, event: React.KeyboardEvent) => {
    const nativeEvent = event.nativeEvent;
    // Escape keeps its default action, so a surrounding popup can still close.
    if (command.type !== 'clear') {
      event.preventDefault();
    }

    switch (command.type) {
      case 'move':
        store.focus.moveTo(
          command.index,
          nativeEvent,
          // An item that isn't rendered yet is selected once it renders and receives focus.
          command.select ? () => store.selection.moveTo(command.index, nativeEvent) : undefined,
        );
        break;
      case 'extend': {
        if (shiftAnchorRef.current === null) {
          shiftAnchorRef.current = store.state.activeIndex;
        }
        const anchorIndex = shiftAnchorRef.current ?? command.index;
        store.focus.moveTo(command.index, nativeEvent);
        store.selection.extendTo(command.index, anchorIndex, nativeEvent);
        break;
      }
      case 'selectRange':
        store.selection.selectRange(command.from, command.to, command.focusIndex, nativeEvent);
        store.focus.moveTo(command.focusIndex, nativeEvent);
        break;
      case 'selectAll':
        store.selection.selectAll(nativeEvent);
        break;
      case 'clear':
        store.selection.clear(nativeEvent);
        break;
      default:
    }
  });

  // Typeahead, like Select and Menu: keys typed in quick succession build one search, which resets
  // after a pause, and typing the same letter again cycles through the items that start with it.
  const typeahead = useTypeahead({
    getLabel: (index) => store.getLabelAt(index),
    getCount: () => store.getCount(),
    elementsRef,
    activeIndex,
    enabled: !disabled,
    resetMs: TYPEAHEAD_RESET_MS,
    onTyping(isTyping) {
      typingRef.current = isTyping;
    },
    onMatch(index, event) {
      store.focus.moveTo(index, event.nativeEvent);
    },
  });

  const setListElement = useStableCallback((element: HTMLElement | null) => {
    store.set('listElement', element);
  });

  // In a virtualized list, the item that holds the tab stop may not be rendered, so the list takes
  // its place in the tab order until it renders.
  let tabIndex: number | undefined = -1;
  if (disabled) {
    tabIndex = undefined;
  } else if (itemCount != null && itemCount > 0 && !activeItemRendered) {
    tabIndex = 0;
  }

  const state: ListboxListState = {
    disabled,
    orientation,
  };

  const defaultProps: HTMLProps = {
    id: id ? `${id}-list` : undefined,
    role: 'listbox',
    'aria-labelledby': labelId,
    'aria-multiselectable': multiple ? true : undefined,
    'aria-disabled': disabled || undefined,
    'aria-orientation': orientation,
    tabIndex,
    onFocus(event) {
      const elements = elementsRef.current;
      if (event.target !== event.currentTarget) {
        return;
      }
      // The list holds focus until the item it's waiting for renders.
      if (store.focus.isPending()) {
        return;
      }
      // The list isn't a tab stop, but it can receive focus programmatically, such as from a
      // `Listbox.Label` click. Pass focus on to the item that holds the tab stop.
      const index = store.state.activeIndex ?? store.getTabStopIndex();
      if (elements[index]) {
        elements[index].focus();
      } else if (itemCount != null && itemCount > 0) {
        // The item isn't rendered, so highlight it to have it scrolled into view.
        store.focus.moveTo(index, event.nativeEvent);
      }
    },
    onBlur(event) {
      if (contains(event.currentTarget, event.relatedTarget)) {
        return;
      }
      store.focus.cancel();
      typeahead.endSession();
      if (event.target === event.currentTarget) {
        // Focus left while the list held it for an item that isn't rendered.
        store.unhighlightItem(event.nativeEvent);
      }
      store.setActiveIndex(store.getTabStopIndex(), event.nativeEvent);
    },
    onMouseLeave(event) {
      store.hoverItem(null, event.nativeEvent);
    },
    onPointerDown() {
      // A new pointer press starts a new Shift+Arrow range from wherever focus lands.
      shiftAnchorRef.current = null;
    },
    onKeyDownCapture(event: React.KeyboardEvent) {
      // Typeahead runs before the items' handlers, so a typed key doesn't reach the item it moved
      // focus away from, and Space continues a search in progress instead of selecting.
      if (event.key === ' ') {
        if (typingRef.current) {
          typeahead.onKeyDown(event);
        }
        return;
      }
      if (
        !disabled &&
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        stopEvent(event);
        typingRef.current = true;
        // The keyboard takes over from the pointer.
        if (store.state.hoveredIndex !== null) {
          store.hoverItem(null, event.nativeEvent);
        }
      }
      typeahead.onKeyDown(event);
    },
    onKeyDown(event: React.KeyboardEvent) {
      if (disabled) {
        return;
      }

      if (event.key === 'Shift') {
        shiftAnchorRef.current = store.state.activeIndex;
      } else if (!event.shiftKey) {
        shiftAnchorRef.current = null;
      }

      const command = resolveListKeyCommand(event, {
        orientation,
        rtl: direction === 'rtl',
        currentIndex: store.state.activeIndex,
        count: itemCount ?? elementsRef.current.length,
        multiple,
        mac: platform.os.mac,
      });
      if (command) {
        runKeyCommand(command, event);
      }

      // The keyboard takes over from the pointer, so the highlight returns to the focused item
      // until the pointer moves again.
      if (store.state.hoveredIndex !== null) {
        store.hoverItem(null, event.nativeEvent);
      }
    },
  };

  // Keeps the tab stop on an item that exists: the first selected item while no item has focus,
  // and the focused item otherwise, wherever it moved to. Runs when the selection, the rendered
  // items or `items` change.
  const value = store.useState('value');
  const syncActiveItem = useStableCallback((map?: Map<Element, { index: number }>) => {
    if (!store.state.itemFocused) {
      store.syncTabStop();
      return;
    }

    // Items can move around the focused item, such as when reordering them, so the tab stop
    // follows the focused item to its new index.
    const listElement = store.state.listElement;
    const focusedElement = activeElement(ownerDocument(listElement));
    const focusedIndex = focusedElement ? map?.get(focusedElement)?.index : undefined;
    if (focusedIndex != null) {
      store.setActiveIndex(focusedIndex);
      return;
    }

    const activeItemIndex = store.state.activeIndex ?? -1;
    const activeItemElement = elementsRef.current[activeItemIndex];
    const listHasFocus = focusedElement != null && focusedElement === listElement;
    if (activeItemElement) {
      // The list held focus for this item, which rendered at another position.
      if (listHasFocus) {
        store.focus.moveTo(activeItemIndex, undefined);
      }
      return;
    }
    // With `items`, an item that isn't rendered still exists.
    const count = store.state.items?.size ?? 0;
    if (activeItemIndex >= 0 && activeItemIndex < count) {
      return;
    }

    // The item that held the tab stop was removed and nothing took its position.
    const tabStopIndex = store.getTabStopIndex();
    if (listHasFocus && count > 0) {
      store.focus.moveTo(tabStopIndex, undefined);
    } else {
      store.focus.cancel();
      store.setActiveIndex(tabStopIndex);
    }
  });
  useIsoLayoutEffect(() => {
    syncActiveItem();
  }, [value, items, syncActiveItem]);

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement],
    state,
    props: [defaultProps, elementProps],
  });

  return (
    <CompositeList
      elementsRef={elementsRef}
      // With `items`, the labels come from the items rather than the rendered text.
      labelsRef={items ? undefined : labelsRef}
      onMapChange={syncActiveItem}
    >
      {element}
    </CompositeList>
  );
});

export interface ListboxListState {
  /**
   * Whether the listbox is disabled.
   */
  disabled: boolean;
  /**
   * The orientation of the listbox.
   */
  orientation: 'vertical' | 'horizontal';
}

export interface ListboxListProps extends BaseUIComponentProps<'div', ListboxListState> {}

export namespace ListboxList {
  export type Props = ListboxListProps;
  export type State = ListboxListState;
}
