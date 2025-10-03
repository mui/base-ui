import * as React from 'react';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { contains, stopEvent } from '../utils';

import type { ElementProps, FloatingRootContext } from '../types';

export interface UseTypeaheadProps {
  /**
   * A ref which contains an array of strings whose indices match the HTML
   * elements of the list.
   * @default empty list
   */
  listRef: React.MutableRefObject<Array<string | null>>;
  /**
   * The index of the active (focused or highlighted) item in the list.
   * @default null
   */
  activeIndex: number | null;
  /**
   * Callback invoked with the matching index if found as the user types.
   */
  onMatch?: (index: number) => void;
  /**
   * Callback invoked with the typing state as the user types.
   */
  onTypingChange?: (isTyping: boolean) => void;
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean;
  /**
   * A function that returns the matching string from the list.
   * @default lowercase-finder
   */
  findMatch?:
    | null
    | ((list: Array<string | null>, typedString: string) => string | null | undefined);
  /**
   * The number of milliseconds to wait before resetting the typed string.
   * @default 750
   */
  resetMs?: number;
  /**
   * An array of keys to ignore when typing.
   * @default []
   */
  ignoreKeys?: Array<string>;
  /**
   * The index of the selected item in the list, if available.
   * @default null
   */
  selectedIndex?: number | null;
}

/**
 * Provides a matching callback that can be used to focus an item as the user
 * types, often used in tandem with `useListNavigation()`.
 * @see https://floating-ui.com/docs/useTypeahead
 */
export function useTypeahead(context: FloatingRootContext, props: UseTypeaheadProps): ElementProps {
  const { open, dataRef, elements } = context;
  const {
    listRef,
    activeIndex,
    onMatch: onMatchProp,
    onTypingChange: onTypingChangeProp,
    enabled = true,
    findMatch = null,
    resetMs = 750,
    ignoreKeys = [],
    selectedIndex = null,
  } = props;

  const timeout = useTimeout();
  const stringRef = React.useRef('');
  const prevIndexRef = React.useRef<number | null>(selectedIndex ?? activeIndex ?? -1);
  const matchIndexRef = React.useRef<number | null>(null);

  const onMatch = useEventCallback(onMatchProp);
  const onTypingChange = useEventCallback(onTypingChangeProp);

  const findMatchRef = useLatestRef(findMatch);
  const ignoreKeysRef = useLatestRef(ignoreKeys);

  useIsoLayoutEffect(() => {
    if (!open && selectedIndex !== null) {
      return;
    }

    timeout.clear();
    matchIndexRef.current = null;

    if (stringRef.current !== '') {
      stringRef.current = '';
    }
  }, [open, selectedIndex, timeout]);

  useIsoLayoutEffect(() => {
    // Sync arrow key navigation but not typeahead navigation.
    if (open && stringRef.current === '') {
      prevIndexRef.current = selectedIndex ?? activeIndex ?? -1;
    }
  }, [open, selectedIndex, activeIndex]);

  const setTypingChange = useEventCallback((value: boolean) => {
    if (value) {
      if (!dataRef.current.typing) {
        dataRef.current.typing = value;
        onTypingChange(value);
      }
    } else if (dataRef.current.typing) {
      dataRef.current.typing = value;
      onTypingChange(value);
    }
  });

  const onKeyDown = useEventCallback((event: React.KeyboardEvent) => {
    function getMatchingIndex(
      list: Array<string | null>,
      orderedList: Array<string | null>,
      string: string,
    ) {
      const str = findMatchRef.current
        ? findMatchRef.current(orderedList, string)
        : orderedList.find(
            (text) => text?.toLocaleLowerCase().indexOf(string.toLocaleLowerCase()) === 0,
          );

      return str ? list.indexOf(str) : -1;
    }

    const listContent = listRef.current;

    if (stringRef.current.length > 0 && stringRef.current[0] !== ' ') {
      if (getMatchingIndex(listContent, listContent, stringRef.current) === -1) {
        setTypingChange(false);
      } else if (event.key === ' ') {
        stopEvent(event);
      }
    }

    if (
      listContent == null ||
      ignoreKeysRef.current.includes(event.key) ||
      // Character key.
      event.key.length !== 1 ||
      // Modifier key.
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }

    if (open && event.key !== ' ') {
      stopEvent(event);
      setTypingChange(true);
    }

    // Capture whether this is a new typing session before mutating the string.
    const isNewSession = stringRef.current === '';

    // Bail out if the list contains a word like "llama" or "aaron". TODO:
    // allow it in this case, too.
    const allowRapidSuccessionOfFirstLetter = listContent.every((text) =>
      text ? text[0]?.toLocaleLowerCase() !== text[1]?.toLocaleLowerCase() : true,
    );

    // Allows the user to cycle through items that start with the same letter
    // in rapid succession.
    if (allowRapidSuccessionOfFirstLetter && stringRef.current === event.key) {
      stringRef.current = '';
      prevIndexRef.current = matchIndexRef.current;
    }

    stringRef.current += event.key;
    timeout.start(resetMs, () => {
      stringRef.current = '';
      prevIndexRef.current = matchIndexRef.current;
      setTypingChange(false);
    });

    // Compute the starting index for this search.
    // If this is a new typing session (string is empty), base it on the current
    // selection/active item; otherwise continue from the last matched index.
    const prevIndex = isNewSession ? (selectedIndex ?? activeIndex ?? -1) : prevIndexRef.current;

    const index = getMatchingIndex(
      listContent,
      [...listContent.slice((prevIndex || 0) + 1), ...listContent.slice(0, (prevIndex || 0) + 1)],
      stringRef.current,
    );

    if (index !== -1) {
      onMatch(index);
      matchIndexRef.current = index;
    } else if (event.key !== ' ') {
      stringRef.current = '';
      setTypingChange(false);
    }
  });

  const onBlur = useEventCallback((event: React.FocusEvent) => {
    const next = event.relatedTarget as Element | null;
    const withinReference = contains(elements.domReference, next);
    const withinFloating = contains(elements.floating, next);

    // Keep the session if focus moves within the composite (reference <-> floating).
    if (withinReference || withinFloating) {
      return;
    }

    // End the current typing session when focus leaves the composite entirely.
    timeout.clear();
    stringRef.current = '';
    prevIndexRef.current = matchIndexRef.current;
    setTypingChange(false);
  });

  const reference: ElementProps['reference'] = React.useMemo(
    () => ({ onKeyDown, onBlur }),
    [onKeyDown, onBlur],
  );

  const floating: ElementProps['floating'] = React.useMemo(() => {
    return {
      onKeyDown,
      onKeyUp(event) {
        if (event.key === ' ') {
          setTypingChange(false);
        }
      },
      onBlur,
    };
  }, [onKeyDown, onBlur, setTypingChange]);

  return React.useMemo(
    () => (enabled ? { reference, floating } : {}),
    [enabled, reference, floating],
  );
}
