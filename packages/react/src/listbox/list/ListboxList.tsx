'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { ownerDocument } from '@base-ui/utils/owner';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useDirection } from '../../internals/direction-context';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { TYPEAHEAD_RESET_MS } from '../../internals/constants';
import { useCompositeRoot, CompositeList } from '../../internals/composite';
import { activeElement, contains } from '../../floating-ui-react/utils';
import { stopEvent } from '../../floating-ui-react/utils/event';
import { useTypeahead } from '../../floating-ui-react';
import { useListboxRootContext } from '../root/ListboxRootContext';
import type { ListboxRoot } from '../root/ListboxRoot';
import { selectionReducer } from '../utils/selectionReducer';
import type { SelectionAction } from '../utils/selectionReducer';

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
  const optInMode = multiple === 'opt-in';
  const direction = useDirection();
  const { labelsRef, lastSelectedIndexRef, setValue, typingRef } = store.context;

  // The keydown being handled by the list, so composite navigation can report it.
  const keyDownEventRef = React.useRef<KeyboardEvent | undefined>(undefined);
  // Where a Shift+Arrow range starts: the item focused when Shift was pressed.
  const shiftAnchorRef = React.useRef<number | null>(null);
  // In opt-in mode, an arrow key that moved focus to an item that isn't rendered selects it once
  // it renders and receives focus.
  const pendingSelectRef = React.useRef<{ index: number; event: KeyboardEvent } | null>(null);

  const onHighlightedIndexChange = useStableCallback((index: number) => {
    const event = keyDownEventRef.current;
    if (event) {
      // Keyboard navigation focuses the item next.
      store.highlightItem(index, event);
    } else {
      // Items were added or removed, so the tab stop moves without focus moving.
      store.setActiveIndex(index);
    }

    // In opt-in mode, moving focus with an arrow key and no modifier moves the selection to
    // the focused item (the APG alternative multiple selection model).
    if (
      optInMode &&
      event &&
      event.key.startsWith('Arrow') &&
      !event.shiftKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      dispatchSelection(
        { type: 'moveSelection', index },
        createChangeEventDetails(REASONS.listNavigation, event),
        index,
      );
    }
  });

  /**
   * The item that should receive focus when the list receives focus: the first selected item,
   * or the first item when nothing is selected, as the APG listbox pattern describes.
   */
  const getTabStopIndex = useStableCallback(() => {
    let tabStopIndex = -1;
    for (const selectedValue of store.state.value) {
      const index = store.indexOfValue(selectedValue);
      if (index !== -1 && (tabStopIndex === -1 || index < tabStopIndex)) {
        tabStopIndex = index;
      }
    }
    return tabStopIndex === -1 ? 0 : tabStopIndex;
  });

  const composite = useCompositeRoot({
    orientation,
    // The APG listbox pattern doesn't wrap focus from the last option to the first.
    loopFocus: false,
    highlightedIndex: activeIndex ?? 0,
    onHighlightedIndexChange,
    direction,
    enableHomeAndEndKeys: true,
    stopEventPropagation: false,
    // Listbox items remain keyboard-focusable even when disabled; selection
    // logic still guards against activating them.
    disabledIndices: EMPTY_ARRAY as number[],
  });

  /**
   * Highlights an item and moves focus to it. In a virtualized list, the item may not be rendered
   * yet, so the list holds focus until it renders and the item takes focus from the list.
   */
  const focusItem = useStableCallback((index: number, event: Event | undefined) => {
    const { pendingFocusIndexRef } = store.context;
    pendingFocusIndexRef.current = null;
    store.highlightItem(index, event);

    const element = composite.elementsRef.current[index];
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
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    dispatchSelection(
      { type: 'moveSelection', index },
      createChangeEventDetails(REASONS.listNavigation, pendingSelect.event),
      index,
    );
  });
  store.useContextCallback('onItemFocus', onItemFocus);

  /**
   * Arrow keys, Home and End with `items`. The composite only knows the rendered items, so the
   * list moves by index instead, through every item.
   */
  const handleVirtualizedNavigation = useStableCallback((event: React.KeyboardEvent) => {
    if (itemCount == null || itemCount === 0) {
      return;
    }
    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    const isRtl = direction === 'rtl';
    let forwardKey = 'ArrowDown';
    let backwardKey = 'ArrowUp';
    if (orientation === 'horizontal') {
      forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
      backwardKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
    }
    const currentIndex = store.state.activeIndex ?? 0;

    let targetIndex: number;
    if (event.key === forwardKey) {
      targetIndex = Math.min(currentIndex + 1, itemCount - 1);
    } else if (event.key === backwardKey) {
      targetIndex = Math.max(currentIndex - 1, 0);
    } else if (event.key === 'Home') {
      targetIndex = 0;
    } else if (event.key === 'End') {
      targetIndex = itemCount - 1;
    } else {
      return;
    }

    event.preventDefault();
    if (targetIndex === currentIndex) {
      return;
    }

    pendingSelectRef.current = null;
    focusItem(targetIndex, event.nativeEvent);

    // In opt-in mode, the selection follows focus (the APG alternative multiple selection model).
    if (optInMode && event.key.startsWith('Arrow')) {
      if (composite.elementsRef.current[targetIndex]) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        dispatchSelection(
          { type: 'moveSelection', index: targetIndex },
          createChangeEventDetails(REASONS.listNavigation, event.nativeEvent),
          targetIndex,
        );
      } else {
        pendingSelectRef.current = { index: targetIndex, event: event.nativeEvent };
      }
    }
  });

  // Typeahead, like Select and Menu: keys typed in quick succession build one search, which resets
  // after a pause, and typing the same letter again cycles through the items that start with it.
  const typeahead = useTypeahead({
    // With `items`, labels come from the collection, including those of items that aren't
    // rendered.
    getLabel: (index) => (items ? items.getLabel(index) : (labelsRef.current[index] ?? null)),
    getCount: () => (items ? items.size : labelsRef.current.length),
    elementsRef: composite.elementsRef,
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

  /**
   * Dispatches a selection action through the reducer and commits the result.
   * Centralizes the pattern of: compute next value → setValue → update anchor.
   */
  const dispatchSelection = useStableCallback(
    (
      action: SelectionAction,
      eventDetails: ListboxRoot.ChangeEventDetails,
      anchorIndex?: number,
    ) => {
      const nextValue = selectionReducer(action, store.state.value, store.getSelectionItems());
      setValue(nextValue, eventDetails);
      if (anchorIndex !== undefined) {
        lastSelectedIndexRef.current = anchorIndex;
      }
    },
  );

  /**
   * Maps keyboard events to selection actions based on the current selection mode.
   * Only handles multi-item keyboard shortcuts (Shift+Arrow, Ctrl+Shift+Home/End, Ctrl+A).
   * Single-item selection (Enter/Space) is handled in ListboxItem.
   */
  const handleSelectionKeyDown = useStableCallback((event: React.KeyboardEvent) => {
    if (!multiple) {
      return;
    }

    const isVertical = orientation === 'vertical';
    const currentIndex = store.state.activeIndex;
    const elements = composite.elementsRef.current;

    const count = itemCount ?? elements.length;

    // Opt-in mode: Ctrl+Arrow moves focus without changing the selection. macOS reserves
    // Ctrl+Arrow and uses Cmd+Arrow to jump to the ends, so Option+Arrow does it there.
    const isMoveWithoutSelecting = platform.os.mac
      ? event.altKey && !event.ctrlKey && !event.metaKey
      : event.ctrlKey || event.metaKey;
    if (optInMode && isMoveWithoutSelecting && !event.shiftKey) {
      const isRtl = direction === 'rtl';
      const isPrev =
        (isVertical && event.key === 'ArrowUp') ||
        (!isVertical && (isRtl ? event.key === 'ArrowRight' : event.key === 'ArrowLeft'));
      const isNext =
        (isVertical && event.key === 'ArrowDown') ||
        (!isVertical && (isRtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight'));

      if ((isPrev || isNext) && currentIndex != null) {
        event.preventDefault();
        const targetIndex = isPrev ? currentIndex - 1 : currentIndex + 1;
        if (store.isIndexInList(targetIndex, elements)) {
          focusItem(targetIndex, event.nativeEvent);
        }
      }
    }

    // Shift+Arrow: Move focus and select the range from the anchor to the focused item,
    // replacing the rest of the selection, so the range grows and shrinks as focus moves.
    if (event.shiftKey && !event.ctrlKey && !event.metaKey) {
      const isRtl = direction === 'rtl';
      const isPrev =
        (isVertical && event.key === 'ArrowUp') ||
        (!isVertical && (isRtl ? event.key === 'ArrowRight' : event.key === 'ArrowLeft'));
      const isNext =
        (isVertical && event.key === 'ArrowDown') ||
        (!isVertical && (isRtl ? event.key === 'ArrowLeft' : event.key === 'ArrowRight'));

      if ((isPrev || isNext) && currentIndex != null) {
        const targetIndex = isPrev ? currentIndex - 1 : currentIndex + 1;

        if (store.isIndexInList(targetIndex, elements)) {
          event.preventDefault();
          if (shiftAnchorRef.current === null) {
            shiftAnchorRef.current = currentIndex;
          }
          const anchorIndex = shiftAnchorRef.current;
          focusItem(targetIndex, event.nativeEvent);

          const currentValue = store.state.value;
          const nextValue = selectionReducer(
            { type: 'extendTo', index: targetIndex, anchorIndex },
            currentValue,
            store.getSelectionItems(),
          );
          if (!areArraysEqual(currentValue, nextValue, store.isSameValue)) {
            setValue(
              nextValue,
              createChangeEventDetails(REASONS.listNavigation, event.nativeEvent),
            );
          }
        }
      }
    }

    // Ctrl+Shift+Home: Select from focus to first
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Home') {
      event.preventDefault();
      if (currentIndex != null) {
        dispatchSelection(
          { type: 'selectRange', from: 0, to: currentIndex },
          createChangeEventDetails(REASONS.listNavigation, event.nativeEvent),
          0,
        );
        focusItem(0, event.nativeEvent);
      }
    }

    // Ctrl+Shift+End: Select from focus to last
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'End') {
      event.preventDefault();
      if (currentIndex != null) {
        const lastIndex = count - 1;
        dispatchSelection(
          { type: 'selectRange', from: currentIndex, to: lastIndex },
          createChangeEventDetails(REASONS.listNavigation, event.nativeEvent),
          lastIndex,
        );
        focusItem(lastIndex, event.nativeEvent);
      }
    }

    // Ctrl+A / Cmd+A: Select all. The APG makes deselecting a fully selected list optional, and
    // Escape already clears the selection.
    if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
      event.preventDefault();
      dispatchSelection(
        { type: 'selectAll' },
        createChangeEventDetails(REASONS.listNavigation, event.nativeEvent),
      );
    }
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
      const elements = composite.elementsRef.current;
      if (event.target !== event.currentTarget) {
        return;
      }
      // The list holds focus until the item it's waiting for renders.
      if (store.context.pendingFocusIndexRef.current !== null) {
        return;
      }
      // The list isn't a tab stop, but it can receive focus programmatically, such as from a
      // `Listbox.Label` click. Pass focus on to the item that holds the tab stop.
      const index = store.state.activeIndex ?? getTabStopIndex();
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
      store.setActiveIndex(getTabStopIndex(), event.nativeEvent);
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

      // Let composite handle unmodified arrow keys, Home, End
      keyDownEventRef.current = event.nativeEvent;
      if (itemCount != null) {
        handleVirtualizedNavigation(event);
      } else {
        composite.props.onKeyDown?.(event);
      }
      keyDownEventRef.current = undefined;

      // Escape: deselect all items (multi-select modes only)
      if (event.key === 'Escape' && multiple) {
        const currentValue = store.state.value;
        if (Array.isArray(currentValue) && currentValue.length > 0) {
          dispatchSelection(
            { type: 'clear' },
            createChangeEventDetails(REASONS.escapeKey, event.nativeEvent),
          );
        }
      }

      // Selection keyboard shortcuts (multiple selection only)
      handleSelectionKeyDown(event);

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
  const onMapChange = useStableCallback((map: Parameters<typeof composite.onMapChange>[0]) => {
    // With `items`, positions come from the items, so they don't shift as items render.
    if (store.state.items != null) {
      if (store.state.activeIndex === null) {
        store.setActiveIndex(getTabStopIndex());
      }
      return;
    }
    composite.onMapChange(map);
    if (!store.state.itemFocused) {
      store.setActiveIndex(getTabStopIndex());
      return;
    }
    // Items can move around the focused item, such as when reordering them, so the tab stop
    // follows the focused item to its new index.
    const focusedElement = activeElement(ownerDocument(store.state.listElement));
    const focusedIndex = composite.elementsRef.current.findIndex(
      (element) => element != null && element === focusedElement,
    );
    if (focusedIndex !== -1) {
      store.setActiveIndex(focusedIndex);
    }
  });
  useIsoLayoutEffect(() => {
    if (!store.state.itemFocused) {
      store.setActiveIndex(getTabStopIndex());
    }
  }, [value, store, getTabStopIndex]);

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement, composite.props.ref],
    state,
    props: [defaultProps, elementProps],
  });

  // Use composite's elementsRef for the CompositeList so that keyboard navigation
  // and item registration share the same ref.
  return (
    <CompositeList
      elementsRef={composite.elementsRef}
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
