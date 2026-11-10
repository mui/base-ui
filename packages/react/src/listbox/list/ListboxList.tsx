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
  const { labelsRef, typingRef } = store.context;

  const elementsRef = React.useRef<Array<HTMLElement | null>>([]);
  // Where a Shift+Arrow range starts: the item focused when Shift was pressed.
  const shiftAnchorRef = React.useRef<number | null>(null);
  // In opt-in mode, an arrow key that moved focus to an item that isn't rendered selects it once
  // it renders and receives focus.
  const pendingSelectRef = React.useRef<{ index: number; event: KeyboardEvent } | null>(null);

  /**
   * Highlights an item and moves focus to it. In a virtualized list, the item may not be rendered
   * yet, so the list holds focus until it renders and the item takes focus from the list.
   */
  const focusItem = useStableCallback((index: number, event: Event | undefined) => {
    const { pendingFocusIndexRef } = store.context;
    pendingFocusIndexRef.current = null;
    store.highlightItem(index, event);

    const element = elementsRef.current[index];
    if (element) {
      element.focus();
      return;
    }

    pendingFocusIndexRef.current = index;
    store.state.listElement?.focus({ preventScroll: true });
  });

  // An item that an arrow key moved focus to in opt-in mode is selected once it renders.
  const onItemFocus = useStableCallback((index: number) => {
    const pendingSelect = pendingSelectRef.current;
    if (pendingSelect?.index !== index) {
      return;
    }
    pendingSelectRef.current = null;
    store.selection.moveTo(index, pendingSelect.event);
  });
  store.useContextCallback('onItemFocus', onItemFocus);

  const runKeyCommand = useStableCallback((command: ListKeyCommand, event: React.KeyboardEvent) => {
    const nativeEvent = event.nativeEvent;
    // Escape keeps its default action, so a surrounding popup can still close.
    if (command.type !== 'clear') {
      event.preventDefault();
    }

    switch (command.type) {
      case 'move':
        pendingSelectRef.current = null;
        focusItem(command.index, nativeEvent);
        if (!command.select) {
          break;
        }
        if (elementsRef.current[command.index]) {
          store.selection.moveTo(command.index, nativeEvent);
        } else {
          // The item isn't rendered yet, so it's selected once it renders and receives focus.
          pendingSelectRef.current = { index: command.index, event: nativeEvent };
        }
        break;
      case 'extend': {
        if (shiftAnchorRef.current === null) {
          shiftAnchorRef.current = store.state.activeIndex;
        }
        const anchorIndex = shiftAnchorRef.current ?? command.index;
        focusItem(command.index, nativeEvent);
        store.selection.extendTo(command.index, anchorIndex, nativeEvent);
        break;
      }
      case 'selectRange':
        store.selection.selectRange(command.from, command.to, command.focusIndex, nativeEvent);
        focusItem(command.focusIndex, nativeEvent);
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
      focusItem(index, event.nativeEvent);
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
    'aria-orientation': orientation,
    tabIndex,
    onFocus(event) {
      const elements = elementsRef.current;
      if (event.target !== event.currentTarget) {
        return;
      }
      // The list holds focus until the item it's waiting for renders.
      if (store.context.pendingFocusIndexRef.current !== null) {
        return;
      }
      // The list isn't a tab stop, but it can receive focus programmatically, such as from a
      // `Listbox.Label` click. Pass focus on to the item that holds the tab stop.
      const index = store.state.activeIndex ?? store.getTabStopIndex();
      if (elements[index]) {
        elements[index].focus();
      } else if (itemCount != null && itemCount > 0) {
        // The item isn't rendered, so highlight it to have it scrolled into view.
        focusItem(index, event.nativeEvent);
      }
    },
    onBlur(event) {
      if (contains(event.currentTarget, event.relatedTarget)) {
        return;
      }
      store.context.pendingFocusIndexRef.current = null;
      pendingSelectRef.current = null;
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

  // While no item has focus, keep the tab stop on the first selected item, including when the
  // selection or the items change.
  const value = store.useState('value');
  const onMapChange = useStableCallback(() => {
    // With `items`, positions come from the items, so they don't shift as items render.
    if (store.state.items != null) {
      if (store.state.activeIndex === null) {
        store.setActiveIndex(store.getTabStopIndex());
      }
      return;
    }
    if (!store.state.itemFocused) {
      store.syncTabStop();
      return;
    }
    // Items can move around the focused item, such as when reordering them, so the tab stop
    // follows the focused item to its new index.
    const focusedElement = activeElement(ownerDocument(store.state.listElement));
    const focusedIndex = elementsRef.current.findIndex(
      (element) => element != null && element === focusedElement,
    );
    if (focusedIndex !== -1) {
      store.setActiveIndex(focusedIndex);
    } else if (!elementsRef.current[store.state.activeIndex ?? -1]) {
      // The focused item was removed and nothing took its position.
      store.setActiveIndex(store.getTabStopIndex());
    }
  });
  useIsoLayoutEffect(() => {
    store.syncTabStop();
  }, [value, store]);

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
      onMapChange={onMapChange}
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
