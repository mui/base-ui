'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { contains } from '@base-ui/utils/shadowDom';
import type { BaseUIComponentProps, BaseUIEvent, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useDirection } from '../../internals/direction-context';
import { TYPEAHEAD_RESET_MS } from '../../internals/constants';
import { CompositeList } from '../../internals/composite/list/CompositeList';
import { stopEvent } from '../../utils/popups/event';
import { useTypeahead } from '../../utils/popups/interactions/useTypeahead';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { ListboxCollection } from '../collection/ListboxCollection';
import { resolveItemKeyPress, resolveListKeyCommand } from '../utils/listKeyCommand';
import type { ListKeyCommand } from '../utils/listKeyCommand';

interface RegisteredItem {
  index: number;
  value: any;
  disabled: boolean;
}

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
  const { className, render, style, children, ...elementProps } = componentProps;

  const store = useListboxRootContext();

  const id = store.useState('id');
  const labelId = store.useState('labelId');
  const orientation = store.useState('orientation');
  const disabled = store.useState('disabled');
  const multiple = store.useState('multiple');
  const items = store.useState('items');
  // With `items`, the list knows every item, including those that aren't rendered.
  const itemCount = items?.size;
  const activeItemRendered = store.useState('activeItemRendered');
  const direction = useDirection();
  const { elementsRef, labelsRef } = store.context;
  // Whether a typeahead search is in progress, in which Space continues it.
  const typingRef = React.useRef(false);

  // Whether a pointer is pressed in the list, which tells a press on the list from focus that
  // arrives another way.
  const pointerPressedRef = React.useRef(false);

  function runKeyCommand(command: ListKeyCommand, event: React.KeyboardEvent) {
    const nativeEvent = event.nativeEvent;
    event.preventDefault();

    switch (command.type) {
      case 'move':
        if (command.focusOnly) {
          store.focus.moveTo(command.index, nativeEvent);
        } else {
          store.focus.navigateTo(command.index, nativeEvent);
        }
        break;
      case 'extend': {
        // The command extends from the item that has focus, so there is one.
        const focusedIndex = store.state.activeIndex as number;
        store.focus.moveTo(command.index, nativeEvent);
        store.selection.extendTo(command.index, focusedIndex, nativeEvent);
        break;
      }
      case 'selectRange':
        store.selection.selectRange(command.from, command.to, command.focusIndex, nativeEvent);
        store.focus.moveTo(command.focusIndex, nativeEvent);
        break;
      case 'selectAll':
        store.selection.selectAll(nativeEvent);
        break;
      default:
    }
  }

  // Typeahead, like Select and Menu: keys typed in quick succession build one search, which resets
  // after a pause, and typing the same letter again cycles through the items that start with it.
  const typeahead = useTypeahead({
    getLabel: (index) => store.getLabelAt(index),
    getCount: () => store.getCount(),
    elementsRef,
    getActiveIndex: () => store.state.activeIndex,
    resetMs: TYPEAHEAD_RESET_MS,
    onTyping(isTyping) {
      typingRef.current = isTyping;
    },
    onMatch(index, event) {
      // The key did something, so it doesn't also trigger a shortcut outside the list.
      stopEvent(event);
      store.focus.navigateTo(index, event.nativeEvent);
    },
  });

  // A disabled list has no highlighted item, including one that had focus when it was disabled.
  useIsoLayoutEffect(() => {
    if (disabled) {
      store.unhighlightItem();
    }
  }, [disabled, store]);

  const setListElement = store.useStateSetter('listElement');

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
      if (event.target === event.currentTarget) {
        store.focus.listFocused(event.nativeEvent, pointerPressedRef.current);
      }
    },
    onBlur(event) {
      if (contains(event.currentTarget, event.relatedTarget)) {
        return;
      }
      pointerPressedRef.current = false;
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
      pointerPressedRef.current = true;
    },
    onPointerUp() {
      pointerPressedRef.current = false;
    },
    onPointerCancel() {
      pointerPressedRef.current = false;
    },
    onKeyDownCapture(event: React.KeyboardEvent) {
      // While a search is in progress, Space continues it instead of selecting the focused item,
      // so it's handled before the item's own handler. Ctrl+Space, and Shift+Space with multiple
      // selection, select items, so they never type.
      const modifiedSpace =
        event.ctrlKey || event.metaKey || (event.shiftKey && multiple !== false);
      if (event.key === ' ' && typingRef.current && !disabled && !modifiedSpace) {
        typeahead.onKeyDown(event);
      }
    },
    onKeyDown(event: React.KeyboardEvent) {
      if (disabled) {
        return;
      }

      pointerPressedRef.current = false;

      // A handler passed to an item or the list can call `preventBaseUIHandler()` to use a key
      // for something else. An item's own button does the same for Enter and Space.
      const prevented = (event as BaseUIEvent<React.KeyboardEvent>).baseUIHandlerPrevented === true;

      // The list holds focus for an item that isn't rendered, so it takes the item's key presses.
      const heldIndex = store.state.activeIndex;
      if (event.target === event.currentTarget && heldIndex !== null && store.focus.isPending()) {
        const modifiers = resolveItemKeyPress(event, { multiple, mac: platform.os.mac });
        if (modifiers) {
          event.preventDefault();
          // Holding the key presses the item once, not on every repeat.
          if (!prevented && !event.repeat) {
            store.pressItem(heldIndex, modifiers, event.nativeEvent);
          }
          return;
        }
      }

      // Typeahead runs after those handlers. A key that matches no item carries on to handlers
      // outside the list.
      if (event.key !== ' ' && !prevented) {
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          typingRef.current = true;
        }
        typeahead.onKeyDown(event);
      }

      const command = resolveListKeyCommand(event, {
        orientation,
        rtl: direction === 'rtl',
        currentIndex: store.state.activeIndex,
        count: store.getCount(),
        multiple,
        mac: platform.os.mac,
      });
      if (command && !prevented) {
        runKeyCommand(command, event);
      }

      // The keyboard takes over from the pointer, so the highlight returns to the focused item
      // until the pointer moves again.
      if (store.state.hoveredIndex !== null) {
        store.hoverItem(null, event.nativeEvent);
      }
    },
  };

  // Keeps the tab stop on an item that exists. Runs when the selection, the rendered items or
  // `items` change.
  const value = store.useState('value');
  const syncActiveItem = useStableCallback((map?: Map<Element, RegisteredItem>) => {
    // Without `items`, the rendered items are the data. They record their own value once they
    // render with their new position, which is after the tab stop is placed below.
    if (map && map.size > 0 && !items) {
      const values = store.context.valuesRef.current;
      const disabledItems = store.context.disabledItemsRef.current;
      values.length = map.size;
      disabledItems.length = map.size;
      map.forEach((item) => {
        values[item.index] = item.value;
        disabledItems[item.index] = item.disabled;
      });
    }
    store.focus.itemsChanged((element) => map?.get(element)?.index);
    store.context.reportHighlightedItem?.();
  });
  useIsoLayoutEffect(() => {
    syncActiveItem();
  }, [value, items, syncActiveItem]);

  // A function child renders each of the root's `items`.
  const resolvedChildren = React.useMemo(
    () =>
      typeof children === 'function' ? <ListboxCollection>{children}</ListboxCollection> : children,
    [children],
  );

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement],
    state,
    props: [defaultProps, { children: resolvedChildren }, elementProps],
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

export interface ListboxListProps extends Omit<
  BaseUIComponentProps<'div', ListboxListState>,
  'children'
> {
  /**
   * The items of the list. A function renders each of the root's `items`: it receives an item, or
   * a group when the items are grouped, and its index.
   */
  children?: React.ReactNode | ((item: any, index: number) => React.ReactNode);
}

export namespace ListboxList {
  export type Props = ListboxListProps;
  export type State = ListboxListState;
}
