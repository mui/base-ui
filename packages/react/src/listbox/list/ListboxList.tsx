'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useDirection } from '../../internals/direction-context';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { TYPEAHEAD_RESET_MS } from '../../internals/constants';
import { compareItemEquality } from '../../internals/itemEquality';
import { useCompositeRoot, CompositeList } from '../../internals/composite';
import { useListboxRootContext } from '../root/ListboxRootContext';
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
  const optInMode = multiple === 'opt-in';
  const direction = useDirection();
  const { disabledItemsRef, labelsRef, lastSelectedIndexRef, setValue, typingRef, valuesRef } =
    store.context;

  // The keydown being handled by the list, so composite navigation can report it.
  const keyDownEventRef = React.useRef<KeyboardEvent | undefined>(undefined);
  // Where a Shift+Arrow range starts: the item focused when Shift was pressed.
  const shiftAnchorRef = React.useRef<number | null>(null);

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
    // the focused item (the APG alternative multiple selection model). Moving to a disabled item
    // clears the selection, since it can't be selected.
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
      dispatchSelection({ type: 'moveSelection', index }, event, index);
    }
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

  // Typeahead: accumulates characters into a search string, then matches against
  // item labels. The search wraps around starting from activeIndex + 1 so typing
  // the same character repeatedly cycles through matches. The buffer resets after
  // TYPEAHEAD_RESET_MS of inactivity.
  const typeaheadStringRef = React.useRef('');
  const typeaheadTimeout = useTimeout();

  const handleTypeahead = useStableCallback((event: React.KeyboardEvent) => {
    if (disabled) {
      return;
    }

    // Ignore modifier keys, control keys, special keys, and Space (which is a selection key)
    if (
      event.key === ' ' ||
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    typingRef.current = true;

    typeaheadStringRef.current += event.key.toLowerCase();

    typeaheadTimeout.start(TYPEAHEAD_RESET_MS, () => {
      typeaheadStringRef.current = '';
      typingRef.current = false;
    });

    const labels = labelsRef.current;
    const searchString = typeaheadStringRef.current;

    const startIndex = activeIndex != null ? activeIndex + 1 : 0;
    const length = labels.length;

    for (let i = 0; i < length; i += 1) {
      const index = (startIndex + i) % length;
      const label = labels[index];
      if (label && label.toLowerCase().startsWith(searchString)) {
        store.highlightItem(index, event.nativeEvent);
        const element = composite.elementsRef.current[index];
        element?.focus();
        break;
      }
    }
  });

  /**
   * Dispatches a selection action through the reducer and commits the result.
   * Centralizes the pattern of: compute next value → setValue → update anchor.
   */
  const dispatchSelection = useStableCallback(
    (action: SelectionAction, event: KeyboardEvent, anchorIndex?: number) => {
      const currentValue = store.state.value;
      const isItemEqualToValue = store.state.isItemEqualToValue;
      const nextValue = selectionReducer(
        action,
        currentValue,
        valuesRef.current,
        disabledItemsRef.current,
        isItemEqualToValue,
      );
      setValue(nextValue, createChangeEventDetails(REASONS.listNavigation, event));
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
    const values = valuesRef.current;
    const isItemEqualToValue = store.state.isItemEqualToValue;

    function focusItem(targetIndex: number) {
      store.highlightItem(targetIndex, event.nativeEvent);
      elements[targetIndex]?.focus();
    }

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
        if (targetIndex >= 0 && targetIndex < elements.length && elements[targetIndex]) {
          focusItem(targetIndex);
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

        if (targetIndex >= 0 && targetIndex < elements.length && elements[targetIndex]) {
          event.preventDefault();
          if (shiftAnchorRef.current === null) {
            shiftAnchorRef.current = currentIndex;
          }
          const anchorIndex = shiftAnchorRef.current;
          focusItem(targetIndex);

          const currentValue = store.state.value;
          const nextValue = selectionReducer(
            { type: 'extendTo', index: targetIndex, anchorIndex },
            currentValue,
            values,
            disabledItemsRef.current,
            isItemEqualToValue,
          );
          if (!areArraysEqual(currentValue, nextValue, isItemEqualToValue)) {
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
        dispatchSelection({ type: 'selectRange', from: 0, to: currentIndex }, event.nativeEvent, 0);
        focusItem(0);
      }
    }

    // Ctrl+Shift+End: Select from focus to last
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'End') {
      event.preventDefault();
      if (currentIndex != null) {
        const lastIndex = elements.length - 1;
        dispatchSelection(
          { type: 'selectRange', from: currentIndex, to: lastIndex },
          event.nativeEvent,
          lastIndex,
        );
        focusItem(lastIndex);
      }
    }

    // Ctrl+A / Cmd+A: Toggle select all
    if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
      event.preventDefault();
      const allValues = values.filter((v, i) => v !== undefined && !disabledItemsRef.current[i]);
      const currentValue = store.state.value;
      const allSelected =
        Array.isArray(currentValue) &&
        allValues.length > 0 &&
        allValues.every((v) =>
          currentValue.some((cv) => compareItemEquality(cv, v, isItemEqualToValue)),
        );
      dispatchSelection(allSelected ? { type: 'clear' } : { type: 'selectAll' }, event.nativeEvent);
    }
  });

  const setListElement = useStableCallback((element: HTMLElement | null) => {
    store.set('listElement', element);
  });

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
    tabIndex: disabled ? undefined : 0,
    onPointerDown() {
      // A new pointer press starts a new Shift+Arrow range from wherever focus lands.
      shiftAnchorRef.current = null;
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
      composite.props.onKeyDown?.(event);
      keyDownEventRef.current = undefined;

      // Escape: deselect all items (multi-select modes only)
      if (event.key === 'Escape' && multiple) {
        const currentValue = store.state.value;
        if (Array.isArray(currentValue) && currentValue.length > 0) {
          dispatchSelection({ type: 'clear' }, event.nativeEvent);
        }
      }

      // Selection keyboard shortcuts (multiple selection only)
      handleSelectionKeyDown(event);

      // Handle typeahead
      handleTypeahead(event);
    },
  };

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
      labelsRef={labelsRef}
      onMapChange={composite.onMapChange}
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
