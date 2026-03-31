'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useCompositeRoot } from '../../composite/root/useCompositeRoot';
import { CompositeList } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { TYPEAHEAD_RESET_MS } from '../../utils/constants';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { compareItemEquality } from '../../utils/itemEquality';
import { selectionReducer, isMultipleSelectionMode } from '../utils/selectionReducer';
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
  const loopFocus = store.useState('loopFocus');
  const disabled = store.useState('disabled');
  const selectionMode = store.useState('selectionMode');
  const direction = useDirection();
  const { disabledItemsRef, labelsRef, lastSelectedIndexRef, setValue, typingRef, valuesRef } =
    store.context;

  const onHighlightedIndexChange = useStableCallback((index: number) => {
    store.set('activeIndex', index);
  });

  const composite = useCompositeRoot({
    orientation,
    loopFocus,
    highlightedIndex: activeIndex ?? 0,
    onHighlightedIndexChange,
    direction,
    enableHomeAndEndKeys: true,
    stopEventPropagation: false,
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
        store.set('activeIndex', index);
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
    if (!isMultipleSelectionMode(selectionMode)) {
      return;
    }

    const isVertical = orientation === 'vertical';
    const currentIndex = store.state.activeIndex;
    const elements = composite.elementsRef.current;
    const values = valuesRef.current;
    const isItemEqualToValue = store.state.isItemEqualToValue;

    function focusItem(targetIndex: number) {
      store.set('activeIndex', targetIndex);
      elements[targetIndex]?.focus();
    }

    // Shift+Arrow: Move focus and toggle selection of the adjacent item
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
          focusItem(targetIndex);
          if (values[targetIndex] !== undefined && !disabledItemsRef.current[targetIndex]) {
            dispatchSelection(
              { type: 'toggle', index: targetIndex },
              event.nativeEvent,
              targetIndex,
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
      const allValues = values.filter((v) => v !== undefined);
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
    'aria-multiselectable': isMultipleSelectionMode(selectionMode) || undefined,
    'aria-orientation': orientation,
    tabIndex: disabled ? undefined : 0,
    onKeyDown(event: React.KeyboardEvent) {
      if (disabled) {
        return;
      }

      // Let composite handle unmodified arrow keys, Home, End
      composite.props.onKeyDown?.(event);

      // Escape: deselect all items (multi-select modes only)
      if (event.key === 'Escape' && isMultipleSelectionMode(selectionMode)) {
        const currentValue = store.state.value;
        if (Array.isArray(currentValue) && currentValue.length > 0) {
          dispatchSelection({ type: 'clear' }, event.nativeEvent);
        }
      }

      // Selection keyboard shortcuts (runs for multiple/explicit-multiple modes)
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
