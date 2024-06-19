'use client';
import * as React from 'react';
import { unstable_useForkRef as useForkRef } from '@mui/utils';
import {
  UseListParameters,
  ListItemState,
  UseListRootSlotProps,
  UseListReturnValue,
} from './useList.types';
import { ListActionTypes } from './listActions.types';
import { useTextNavigation } from '../utils/useTextNavigation';
import { MuiCancellableEvent } from '../utils/MuiCancellableEvent';
import { extractEventHandlers } from '../utils/extractEventHandlers';
import { EventHandlers } from '../utils/types';

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
    getItemDomElement,
    getItemId,
    rootRef: externalListRef,
    highlightedValue,
    selectedValues,
    dispatch,
    orientation = 'vertical',
  } = params;

  if (process.env.NODE_ENV !== 'production') {
    if (focusManagement === 'DOM' && getItemDomElement == null) {
      throw new Error(
        'useList: The `getItemDomElement` prop is required when using the `DOM` focus management.',
      );
    }

    if (focusManagement === 'activeDescendant' && getItemId == null) {
      throw new Error(
        'useList: The `getItemId` prop is required when using the `activeDescendant` focus management.',
      );
    }
  }

  const listRef = React.useRef<HTMLUListElement>(null);
  const handleRef = useForkRef(externalListRef, listRef);

  const handleTextNavigation = useTextNavigation((searchString, event) =>
    dispatch({
      type: ListActionTypes.textNavigation,
      event,
      searchString,
    }),
  );

  const createHandleKeyDown =
    (externalHandlers: EventHandlers) =>
    (event: React.KeyboardEvent<HTMLElement> & MuiCancellableEvent) => {
      externalHandlers.onKeyDown?.(event);

      if (event.defaultMuiPrevented) {
        return;
      }

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
    };

  const createHandleBlur =
    (externalHandlers: EventHandlers) =>
    (event: React.FocusEvent<HTMLElement> & MuiCancellableEvent) => {
      externalHandlers.onBlur?.(event);

      if (event.defaultMuiPrevented) {
        return;
      }

      if (listRef.current?.contains(event.relatedTarget)) {
        // focus remains within the list
        return;
      }

      dispatch({
        type: ListActionTypes.blur,
        event,
      });
    };

  const getRootProps = <ExternalProps extends Record<string, any> = {}>(
    externalProps: ExternalProps = {} as ExternalProps,
  ): UseListRootSlotProps<ExternalProps> => {
    const externalEventHandlers = extractEventHandlers(externalProps);
    return {
      ...externalProps,
      'aria-activedescendant':
        focusManagement === 'activeDescendant' && highlightedValue != null
          ? getItemId!(highlightedValue)
          : undefined,
      tabIndex: focusManagement === 'DOM' ? -1 : 0,
      ref: handleRef,
      ...externalEventHandlers,
      onBlur: createHandleBlur(externalEventHandlers),
      onKeyDown: createHandleKeyDown(externalEventHandlers),
    };
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
