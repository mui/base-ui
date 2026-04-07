'use client';
import * as React from 'react';
import { isElementDisabled } from '@base-ui/utils/isElementDisabled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import {
  ALL_KEYS,
  ARROW_DOWN,
  ARROW_KEYS,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  END,
  HOME,
  HORIZONTAL_KEYS,
  HORIZONTAL_KEYS_WITH_EXTRA_KEYS,
  MODIFIER_KEYS,
  VERTICAL_KEYS,
  VERTICAL_KEYS_WITH_EXTRA_KEYS,
  createGridCellMap,
  findNonDisabledListIndex,
  getGridCellIndexOfCorner,
  getGridCellIndices,
  getGridNavigatedIndex,
  getMaxListIndex,
  getMinListIndex,
  isListIndexDisabled,
  isIndexOutOfListBounds,
  isNativeInput,
  scrollIntoViewIfNeeded,
  type Dimensions,
  type ModifierKey,
} from '../composite';
import { ACTIVE_COMPOSITE_ITEM } from '../constants';
import { CompositeMetadata } from '../list/CompositeList';
import { HTMLProps } from '../../utils/types';
import { getTarget } from '../../floating-ui-react/utils';

export interface UseCompositeRootParameters {
  orientation?: 'horizontal' | 'vertical' | 'both' | undefined;
  cols?: number | undefined;
  loopFocus?: boolean | undefined;
  onLoop?:
    | ((
        event: React.KeyboardEvent,
        prevIndex: number,
        nextIndex: number,
        elementsRef: React.RefObject<(HTMLDivElement | null)[]>,
      ) => number)
    | undefined;
  highlightedIndex?: number | undefined;
  onHighlightedIndexChange?: ((index: number) => void) | undefined;
  dense?: boolean | undefined;
  direction: TextDirection;
  itemSizes?: Array<Dimensions> | undefined;
  rootRef?: React.Ref<Element> | undefined;
  /**
   * When `true`, pressing the Home key moves focus to the first item,
   * and pressing the End key moves focus to the last item.
   * @default false
   */
  enableHomeAndEndKeys?: boolean | undefined;
  /**
   * When `true`, keypress events on Composite's navigation keys
   * be stopped with event.stopPropagation().
   * @default false
   */
  stopEventPropagation?: boolean | undefined;
  /**
   * Array of item indices to be considered disabled.
   * Used for composite items that are focusable when disabled.
   */
  disabledIndices?: number[] | undefined;
  /**
   * Array of [modifier key values](https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values#modifier_keys) that should allow normal keyboard actions
   * when pressed. By default, all modifier keys prevent normal actions.
   * @default []
   */
  modifierKeys?: ModifierKey[] | undefined;
}

const EMPTY_ARRAY: never[] = [];

const PREVENTED_KEYS = {
  horizontal: HORIZONTAL_KEYS,
  vertical: VERTICAL_KEYS,
  both: ARROW_KEYS,
};
const PREVENTED_KEYS_WITH_EXTRA = {
  horizontal: HORIZONTAL_KEYS_WITH_EXTRA_KEYS,
  vertical: VERTICAL_KEYS_WITH_EXTRA_KEYS,
  both: ALL_KEYS,
};

const CORNER_BY_KEY: Record<string, 'bl' | 'tr' | 'tl'> = {
  [ARROW_DOWN]: 'bl',
  [ARROW_RIGHT]: 'tr',
};

export function useCompositeRoot(params: UseCompositeRootParameters) {
  const {
    itemSizes,
    cols = 1,
    loopFocus = true,
    onLoop,
    dense = false,
    orientation = 'both',
    direction,
    highlightedIndex: externalHighlightedIndex,
    onHighlightedIndexChange: externalSetHighlightedIndex,
    rootRef: externalRef,
    enableHomeAndEndKeys = false,
    stopEventPropagation = false,
    disabledIndices,
    modifierKeys = EMPTY_ARRAY,
  } = params;

  const [internalHighlightedIndex, internalSetHighlightedIndex] = React.useState(0);

  const isGrid = cols > 1;

  const rootRef = React.useRef<HTMLElement | null>(null);
  const mergedRef = useMergedRefs(rootRef, externalRef);

  const elementsRef = React.useRef<Array<HTMLDivElement | null>>([]);
  const hasSetDefaultIndexRef = React.useRef(false);

  const highlightedIndex = externalHighlightedIndex ?? internalHighlightedIndex;
  const onHighlightedIndexChange = useStableCallback((index, shouldScrollIntoView = false) => {
    (externalSetHighlightedIndex ?? internalSetHighlightedIndex)(index);
    if (shouldScrollIntoView) {
      const newActiveItem = elementsRef.current[index];
      scrollIntoViewIfNeeded(rootRef.current, newActiveItem, direction, orientation);
    }
  });

  const onMapChange = useStableCallback((map: Map<Element, CompositeMetadata<any>>) => {
    if (map.size === 0 || hasSetDefaultIndexRef.current) {
      return;
    }
    hasSetDefaultIndexRef.current = true;
    const sortedElements = Array.from(map.keys());
    const activeItem = sortedElements.find((compositeElement) =>
      compositeElement?.hasAttribute(ACTIVE_COMPOSITE_ITEM),
    ) as HTMLElement | null;
    // Set the default highlighted index of an arbitrary composite item.
    const activeIndex = activeItem ? sortedElements.indexOf(activeItem) : -1;

    if (activeIndex !== -1) {
      onHighlightedIndexChange(activeIndex);
    }

    scrollIntoViewIfNeeded(rootRef.current, activeItem, direction, orientation);
  });

  const props = React.useMemo<HTMLProps>(
    () => ({
      'aria-orientation': orientation === 'both' ? undefined : orientation,
      ref: mergedRef,
      onFocus(event) {
        const element = rootRef.current;
        const target = getTarget(event.nativeEvent);
        if (!element || target == null || !isNativeInput(target)) {
          return;
        }
        target.setSelectionRange(0, target.value.length);
      },
      onKeyDown(event) {
        const RELEVANT_KEYS = enableHomeAndEndKeys ? ALL_KEYS : ARROW_KEYS;
        if (!RELEVANT_KEYS.has(event.key)) {
          return;
        }

        if (isModifierKeySet(event, modifierKeys)) {
          return;
        }

        const element = rootRef.current;
        if (!element) {
          return;
        }
        const isRtl = direction === 'rtl';

        const horizontalForwardKey = isRtl ? ARROW_LEFT : ARROW_RIGHT;
        const forwardKey = {
          horizontal: horizontalForwardKey,
          vertical: ARROW_DOWN,
          both: horizontalForwardKey,
        }[orientation];
        const horizontalBackwardKey = isRtl ? ARROW_RIGHT : ARROW_LEFT;
        const backwardKey = {
          horizontal: horizontalBackwardKey,
          vertical: ARROW_UP,
          both: horizontalBackwardKey,
        }[orientation];

        const target = getTarget(event.nativeEvent);
        if (target != null && isNativeInput(target) && !isElementDisabled(target)) {
          const selectionStart = target.selectionStart;
          const selectionEnd = target.selectionEnd;
          const textContent = target.value ?? '';
          // return to native textbox behavior when
          // 1 - Shift is held to make a text selection, or if there already is a text selection
          if (selectionStart == null || event.shiftKey || selectionStart !== selectionEnd) {
            return;
          }
          // 2 - arrow-ing forward and not in the last position of the text
          if (event.key !== backwardKey && selectionStart < textContent.length) {
            return;
          }
          // 3 -arrow-ing backward and not in the first position of the text
          if (event.key !== forwardKey && selectionStart > 0) {
            return;
          }
        }

        let nextIndex = highlightedIndex;
        const minIndex = getMinListIndex(elementsRef, disabledIndices);
        const maxIndex = getMaxListIndex(elementsRef, disabledIndices);

        if (isGrid) {
          const sizes =
            itemSizes ||
            Array.from({ length: elementsRef.current.length }, () => ({
              width: 1,
              height: 1,
            }));
          // To calculate movements on the grid, we use hypothetical cell indices
          // as if every item was 1x1, then convert back to real indices.
          const cellMap = createGridCellMap(sizes, cols, dense);
          const minGridIndex = cellMap.findIndex(
            (index) =>
              index != null && !isListIndexDisabled(elementsRef.current, index, disabledIndices),
          );
          // last enabled index
          const maxGridIndex = cellMap.reduce(
            (foundIndex: number, index, cellIndex) =>
              index != null && !isListIndexDisabled(elementsRef.current, index, disabledIndices)
                ? cellIndex
                : foundIndex,
            -1,
          );

          nextIndex = cellMap[
            getGridNavigatedIndex(
              cellMap.map((itemIndex) =>
                itemIndex != null ? elementsRef.current[itemIndex] : null,
              ),
              {
                event,
                orientation,
                loopFocus,
                onLoop: onLoop
                  ? (e, prev, next) => onLoop(e, prev, next, elementsRef)
                  : (_e, _prev, next) => next,
                cols,
                // treat undefined (empty grid spaces) as disabled indices so we
                // don't end up in them
                disabledIndices: getGridCellIndices(
                  [
                    ...(disabledIndices ||
                      elementsRef.current.map((_, index) =>
                        isListIndexDisabled(elementsRef.current, index) ? index : undefined,
                      )),
                    undefined,
                  ],
                  cellMap,
                ),
                minIndex: minGridIndex,
                maxIndex: maxGridIndex,
                prevIndex: getGridCellIndexOfCorner(
                  highlightedIndex > maxIndex ? minIndex : highlightedIndex,
                  sizes,
                  cellMap,
                  cols,
                  // use a corner matching the edge closest to the direction we're
                  // moving in so we don't end up in the same item. Prefer
                  // top/left over bottom/right.
                  CORNER_BY_KEY[event.key] ?? 'tl',
                ),
                rtl: isRtl,
              },
            )
          ] as number; // navigated cell will never be nullish
        }

        const forwardKeys = {
          horizontal: [horizontalForwardKey],
          vertical: [ARROW_DOWN],
          both: [horizontalForwardKey, ARROW_DOWN],
        }[orientation];

        const backwardKeys = {
          horizontal: [horizontalBackwardKey],
          vertical: [ARROW_UP],
          both: [horizontalBackwardKey, ARROW_UP],
        }[orientation];

        const preventedKeys = isGrid
          ? RELEVANT_KEYS
          : (enableHomeAndEndKeys ? PREVENTED_KEYS_WITH_EXTRA : PREVENTED_KEYS)[orientation];

        if (enableHomeAndEndKeys) {
          if (event.key === HOME) {
            nextIndex = minIndex;
          } else if (event.key === END) {
            nextIndex = maxIndex;
          }
        }

        const isForward = forwardKeys.includes(event.key);
        const isBackward = backwardKeys.includes(event.key);

        if (nextIndex === highlightedIndex && (isForward || isBackward)) {
          if (
            loopFocus &&
            ((nextIndex === maxIndex && isForward) || (nextIndex === minIndex && isBackward))
          ) {
            nextIndex = isForward ? minIndex : maxIndex;
            if (onLoop) {
              nextIndex = onLoop(event, highlightedIndex, nextIndex, elementsRef);
            }
          } else {
            nextIndex = findNonDisabledListIndex(elementsRef.current, {
              startingIndex: nextIndex,
              decrement: isBackward,
              disabledIndices,
            });
          }
        }

        if (
          nextIndex !== highlightedIndex &&
          !isIndexOutOfListBounds(elementsRef.current, nextIndex)
        ) {
          if (stopEventPropagation) {
            event.stopPropagation();
          }

          if (preventedKeys.has(event.key)) {
            event.preventDefault();
          }
          onHighlightedIndexChange(nextIndex, true);

          // Wait for FocusManager `returnFocus` to execute.
          queueMicrotask(() => {
            elementsRef.current[nextIndex]?.focus();
          });
        }
      },
    }),
    [
      cols,
      dense,
      direction,
      disabledIndices,
      elementsRef,
      enableHomeAndEndKeys,
      highlightedIndex,
      isGrid,
      itemSizes,
      loopFocus,
      onLoop,
      mergedRef,
      modifierKeys,
      onHighlightedIndexChange,
      orientation,
      stopEventPropagation,
    ],
  );

  return React.useMemo(
    () => ({
      props,
      highlightedIndex,
      onHighlightedIndexChange,
      elementsRef,
      disabledIndices,
      onMapChange,
      relayKeyboardEvent: props.onKeyDown!,
    }),
    [props, highlightedIndex, onHighlightedIndexChange, elementsRef, disabledIndices, onMapChange],
  );
}

function isModifierKeySet(event: React.KeyboardEvent, ignoredModifierKeys: ModifierKey[]) {
  for (const key of MODIFIER_KEYS) {
    if (ignoredModifierKeys.includes(key)) {
      continue;
    }
    if (event.getModifierState(key)) {
      return true;
    }
  }
  return false;
}
