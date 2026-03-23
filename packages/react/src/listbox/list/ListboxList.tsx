'use client';
import * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps, HTMLProps } from '../../utils/types';
import { useListboxRootContext } from '../root/ListboxRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useCompositeRoot } from '../../composite/root/useCompositeRoot';
import { CompositeList } from '../../composite/list/CompositeList';
import { useDirection } from '../../direction-provider/DirectionContext';
import { selectors } from '../store';
import { TYPEAHEAD_RESET_MS } from '../../utils/constants';
import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { compareItemEquality } from '../../utils/itemEquality';

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
  const { className, render, ...elementProps } = componentProps;

  const {
    store,
    labelsRef,
    valuesRef,
    typingRef,
    orientation,
    loopFocus,
    disabled,
    readOnly,
    multiple,
    setValue,
    lastSelectedIndexRef,
  } = useListboxRootContext();

  const id = useStore(store, selectors.id);
  const labelId = useStore(store, selectors.labelId);
  const activeIndex = useStore(store, selectors.activeIndex);
  const direction = useDirection();

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
    if (disabled || readOnly) {
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

  const handleMultiSelectKeyDown = useStableCallback((event: React.KeyboardEvent) => {
    const isVertical = orientation === 'vertical';
    const currentIndex = store.state.activeIndex;
    const elements = composite.elementsRef.current;
    const values = valuesRef.current;
    const isItemEqualToValue = store.state.isItemEqualToValue;

    function focusItem(targetIndex: number) {
      store.set('activeIndex', targetIndex);
      elements[targetIndex]?.focus();
    }

    function getSelectedValues(): any[] {
      const val = store.state.value;
      return Array.isArray(val) ? val : [];
    }

    function addValue(value: any, currentValue: any[]) {
      if (!currentValue.some((v) => compareItemEquality(v, value, isItemEqualToValue))) {
        return [...currentValue, value];
      }
      return currentValue;
    }

    function selectRange(from: number, to: number) {
      const start = Math.min(from, to);
      const end = Math.max(from, to);
      const currentValue = getSelectedValues();
      let nextValue = [...currentValue];
      for (let i = start; i <= end; i += 1) {
        const val = values[i];
        if (val !== undefined) {
          nextValue = addValue(val, nextValue);
        }
      }
      return nextValue;
    }

    // Shift+ArrowDown / Shift+ArrowUp: Move focus and add target to selection
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
          const targetValue = values[targetIndex];
          if (targetValue !== undefined) {
            let nextValue = getSelectedValues();
            // Ensure the anchor (current) item is also selected
            const currentValue = values[currentIndex];
            if (currentValue !== undefined) {
              nextValue = addValue(currentValue, nextValue);
            }
            nextValue = addValue(targetValue, nextValue);
            setValue(nextValue, createChangeEventDetails(REASONS.listNavigation, event.nativeEvent));
            lastSelectedIndexRef.current = targetIndex;
          }
        }
      }
    }

    // Ctrl+Shift+Home: Select focused option and all options up to the first
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Home') {
      event.preventDefault();
      if (currentIndex != null) {
        const nextValue = selectRange(0, currentIndex);
        setValue(nextValue, createChangeEventDetails(REASONS.listNavigation, event.nativeEvent));
        focusItem(0);
        lastSelectedIndexRef.current = 0;
      }
    }

    // Ctrl+Shift+End: Select focused option and all options down to the last
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'End') {
      event.preventDefault();
      if (currentIndex != null) {
        const lastIndex = elements.length - 1;
        const nextValue = selectRange(currentIndex, lastIndex);
        setValue(nextValue, createChangeEventDetails(REASONS.listNavigation, event.nativeEvent));
        focusItem(lastIndex);
        lastSelectedIndexRef.current = lastIndex;
      }
    }

    // Ctrl+A: Select all / deselect all
    if ((event.ctrlKey || event.metaKey) && (event.key === 'a' || event.key === 'A')) {
      event.preventDefault();
      const allValues = values.filter((v) => v !== undefined);
      const currentValue = getSelectedValues();
      const allSelected = allValues.length > 0 && allValues.every((v) =>
        currentValue.some((cv) => compareItemEquality(cv, v, isItemEqualToValue)),
      );
      const nextValue = allSelected ? [] : [...allValues];
      setValue(nextValue, createChangeEventDetails(REASONS.listNavigation, event.nativeEvent));
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
    'aria-multiselectable': multiple || undefined,
    'aria-orientation': orientation,
    tabIndex: disabled ? undefined : 0,
    onKeyDown(event: React.KeyboardEvent) {
      if (disabled || readOnly) {
        return;
      }

      // Let composite handle unmodified arrow keys, Home, End
      composite.props.onKeyDown?.(event);

      // Multi-select keyboard shortcuts (ARIA recommended selection model)
      if (multiple && !disabled && !readOnly) {
        handleMultiSelectKeyDown(event);
      }

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
