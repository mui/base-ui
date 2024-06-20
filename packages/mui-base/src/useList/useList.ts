'use client';
import * as React from 'react';
import { unstable_useForkRef as useForkRef } from '@mui/utils';
import {
  UseListParameters,
  ListItemState,
  UseListReturnValue,
  ListItemMetadata,
} from './useList.types';
import { ListActionTypes } from './listActions.types';
import { useTextNavigation } from '../utils/useTextNavigation';
import { GenericHTMLProps } from '../utils/types';
import { mergeReactProps } from '../utils/mergeReactProps';
import { IndexableMap } from '../utils/IndexableMap';

/**
 * The useList is a lower-level utility that is used to build list-like components.
 * It's used to manage the state of the list and its items.
 *
 * Supports highlighting a single item and selecting an arbitrary number of items.
 *
 * The state of the list is managed by a controllable reducer - that is a reducer that can have its state
 * controlled from outside.
 *
 * By default, the state consists of `selectedValues` and `highlightedValue` but can be extended by the caller of the hook.
 * Also the actions that can be dispatched and the reducer function can be defined externally.
 *
 * @template ItemValue The type of the item values.
 *
 * @ignore - internal hook.
 */
function useList<ItemValue>(params: UseListParameters<ItemValue>): UseListReturnValue<ItemValue> {
  const {
    focusManagement = 'activeDescendant',
    rootRef: externalListRef,
    highlightedValue,
    selectedValues,
    dispatch,
    orientation = 'vertical',
    items, // TODO: it should be just `state`
  } = params;

  const listRef = React.useRef<HTMLUListElement>(null);
  const handleRef = useForkRef(externalListRef, listRef);

  const handleTextNavigation = useTextNavigation((searchString, event) =>
    dispatch({
      type: ListActionTypes.textNavigation,
      event,
      searchString,
    }),
  );

  const previousItems = React.useRef<IndexableMap<ItemValue, ListItemMetadata<ItemValue>>>(
    new IndexableMap(),
  );

  React.useEffect(() => {
    // Whenever the `items` object changes, we need to determine if the actual items changed.
    // If they did, we need to dispatch an `itemsChange` action, so the selected/highlighted state is updated.
    if (IndexableMap.areEqual(previousItems.current, items)) {
      return;
    }

    dispatch({
      type: ListActionTypes.itemsChange,
      event: null,
      items,
    });

    previousItems.current = items;
  }, [items, dispatch]);

  const getRootProps = (externalProps?: GenericHTMLProps): GenericHTMLProps => {
    return mergeReactProps(externalProps, {
      'aria-activedescendant':
        focusManagement === 'activeDescendant' && highlightedValue != null
          ? items.get(highlightedValue)?.idAttribute
          : undefined,
      tabIndex: focusManagement === 'DOM' ? -1 : 0,
      ref: handleRef,
      onBlur: (event: React.FocusEvent) => {
        if (listRef.current?.contains(event.relatedTarget)) {
          // focus remains within the list
          return;
        }

        dispatch({
          type: ListActionTypes.blur,
          event,
        });
      },
      onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
        const keysToPreventDefault = ['Home', 'End', 'PageUp', 'PageDown'];

        if (orientation === 'vertical') {
          keysToPreventDefault.push('ArrowUp', 'ArrowDown');
        } else {
          keysToPreventDefault.push('ArrowLeft', 'ArrowRight');
        }

        if (focusManagement === 'activeDescendant') {
          // When the child element is focused using the activeDescendant attribute,
          // the list handles keyboard events on its behalf.
          // We have to `preventDefault()` is this case to prevent the browser from
          // scrolling the view when space is pressed or submitting forms when enter is pressed.
          keysToPreventDefault.push(' ', 'Enter');
        }

        if (keysToPreventDefault.includes(event.key)) {
          event.preventDefault();
        }

        dispatch({
          type: ListActionTypes.keyDown,
          key: event.key,
          event,
        });

        handleTextNavigation(event);
      },
    });
  };

  const getItemState = React.useCallback(
    (item: ItemValue): ListItemState => {
      const selected = (selectedValues ?? []).some((value) => value != null && item === value);

      const highlighted = highlightedValue != null && item === highlightedValue;
      const focusable = focusManagement === 'DOM';

      return {
        focusable,
        highlighted,
        selected,
      };
    },
    [selectedValues, highlightedValue, focusManagement],
  );

  return {
    getRootProps,
    getItemState,
    rootRef: handleRef,
  };
}

export { useList };
