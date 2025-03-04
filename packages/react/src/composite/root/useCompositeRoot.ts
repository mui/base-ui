'use client';
import * as React from 'react';
import type { TextDirection } from '../../direction-provider/DirectionContext';
import { isElementDisabled } from '../../utils/isElementDisabled';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForkRef } from '../../utils/useForkRef';
import {
  ALL_KEYS,
  ARROW_DOWN,
  ARROW_KEYS,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  buildCellMap,
  END,
  findNonDisabledIndex,
  getCellIndexOfCorner,
  getCellIndices,
  getGridNavigatedIndex,
  getMaxIndex,
  getMinIndex,
  getTextDirection,
  HOME,
  HORIZONTAL_KEYS,
  HORIZONTAL_KEYS_WITH_EXTRA_KEYS,
  isDisabled,
  isIndexOutOfBounds,
  isNativeInput,
  VERTICAL_KEYS,
  VERTICAL_KEYS_WITH_EXTRA_KEYS,
  type Dimensions,
} from '../composite';

export interface UseCompositeRootParameters {
  orientation?: 'horizontal' | 'vertical' | 'both';
  cols?: number;
  loop?: boolean;
  highlightedIndex?: number;
  onHighlightedIndexChange?: (index: number) => void;
  dense?: boolean;
  direction?: TextDirection;
  itemSizes?: Array<Dimensions>;
  rootRef?: React.Ref<Element>;
  /**
   * When `true`, pressing the Home key moves focus to the first item,
   * and pressing the End key moves focus to the last item.
   * @default false
   */
  enableHomeAndEndKeys?: boolean;
  /**
   * When `true`, keypress events on Composite's navigation keys
   * be stopped with event.stopPropagation()
   * @default false
   */
  stopEventPropagation?: boolean;
  /**
   * Array of item indices to be considered disabled.
   * Used for composite items that are focusable when disabled.
   */
  disabledIndices?: number[];
}

/**
 * @ignore - internal hook.
 */
export function useCompositeRoot(params: UseCompositeRootParameters) {
  const {
    itemSizes,
    cols = 1,
    loop = true,
    dense = false,
    orientation = 'both',
    direction,
    highlightedIndex: externalHighlightedIndex,
    onHighlightedIndexChange: externalSetHighlightedIndex,
    rootRef: externalRef,
    enableHomeAndEndKeys = false,
    stopEventPropagation = false,
    disabledIndices,
  } = params;

  const [internalHighlightedIndex, internalSetHighlightedIndex] = React.useState(0);

  const isGrid = cols > 1;

  const highlightedIndex = externalHighlightedIndex ?? internalHighlightedIndex;
  const onHighlightedIndexChange = useEventCallback(
    externalSetHighlightedIndex ?? internalSetHighlightedIndex,
  );

  const textDirectionRef = React.useRef<TextDirection | null>(direction ?? null);

  const rootRef = React.useRef<HTMLElement | null>(null);
  const mergedRef = useForkRef(rootRef, externalRef);

  const elementsRef = React.useRef<Array<HTMLDivElement | null>>([]);

  const arrowKeyTravelDirectionRef = React.useRef<'end' | 'start'>(null);

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-orientation': orientation === 'both' ? undefined : orientation,
        ref: mergedRef,
        onFocus(event) {
          const element = rootRef.current;
          if (!element || !isNativeInput(event.target)) {
            return;
          }
          if (arrowKeyTravelDirectionRef.current == null) {
            return;
          }
          const textContentLength = event.target.value.length ?? 0;
          if (arrowKeyTravelDirectionRef.current === 'end') {
            event.target.setSelectionRange(0, 0);
          } else if (textContentLength && arrowKeyTravelDirectionRef.current === 'start') {
            event.target.setSelectionRange(textContentLength, textContentLength);
          }
        },
        onKeyDown(event) {
          const RELEVANT_KEYS = enableHomeAndEndKeys ? ALL_KEYS : ARROW_KEYS;
          if (!RELEVANT_KEYS.includes(event.key)) {
            return;
          }

          const element = rootRef.current;
          if (!element) {
            return;
          }

          if ((event.target as HTMLElement).closest('[data-floating-ui-portal]') != null) {
            // don't navigate if the event came from a popup
            return;
          }

          if (textDirectionRef?.current == null) {
            textDirectionRef.current = getTextDirection(element);
          }
          const isRtl = textDirectionRef.current === 'rtl';

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

          if (event.key === forwardKey) {
            arrowKeyTravelDirectionRef.current = 'end';
          }
          if (event.key === backwardKey) {
            arrowKeyTravelDirectionRef.current = 'start';
          }

          if (isNativeInput(event.target) && !isElementDisabled(event.target)) {
            const selectionStart = event.target.selectionStart;
            const selectionEnd = event.target.selectionEnd;
            const textContent = event.target.value ?? '';
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
          const minIndex = getMinIndex(elementsRef, disabledIndices);
          const maxIndex = getMaxIndex(elementsRef, disabledIndices);

          if (isGrid) {
            const sizes =
              itemSizes ||
              Array.from({ length: elementsRef.current.length }, () => ({
                width: 1,
                height: 1,
              }));
            // To calculate movements on the grid, we use hypothetical cell indices
            // as if every item was 1x1, then convert back to real indices.
            const cellMap = buildCellMap(sizes, cols, dense);
            const minGridIndex = cellMap.findIndex(
              (index) => index != null && !isDisabled(elementsRef.current, index, disabledIndices),
            );
            // last enabled index
            const maxGridIndex = cellMap.reduce(
              (foundIndex: number, index, cellIndex) =>
                index != null && !isDisabled(elementsRef.current, index, disabledIndices)
                  ? cellIndex
                  : foundIndex,
              -1,
            );

            nextIndex = cellMap[
              getGridNavigatedIndex(
                {
                  current: cellMap.map((itemIndex) =>
                    itemIndex ? elementsRef.current[itemIndex] : null,
                  ),
                },
                {
                  event,
                  orientation,
                  loop,
                  cols,
                  // treat undefined (empty grid spaces) as disabled indices so we
                  // don't end up in them
                  disabledIndices: getCellIndices(
                    [
                      ...(disabledIndices ||
                        elementsRef.current.map((_, index) =>
                          isDisabled(elementsRef.current, index) ? index : undefined,
                        )),
                      undefined,
                    ],
                    cellMap,
                  ),
                  minIndex: minGridIndex,
                  maxIndex: maxGridIndex,
                  prevIndex: getCellIndexOfCorner(
                    highlightedIndex > maxIndex ? minIndex : highlightedIndex,
                    sizes,
                    cellMap,
                    cols,
                    // use a corner matching the edge closest to the direction we're
                    // moving in so we don't end up in the same item. Prefer
                    // top/left over bottom/right.
                    // eslint-disable-next-line no-nested-ternary
                    event.key === ARROW_DOWN ? 'bl' : event.key === ARROW_RIGHT ? 'tr' : 'tl',
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
            : {
                horizontal: enableHomeAndEndKeys
                  ? HORIZONTAL_KEYS_WITH_EXTRA_KEYS
                  : HORIZONTAL_KEYS,
                vertical: enableHomeAndEndKeys ? VERTICAL_KEYS_WITH_EXTRA_KEYS : VERTICAL_KEYS,
                both: RELEVANT_KEYS,
              }[orientation];

          if (enableHomeAndEndKeys) {
            if (event.key === HOME) {
              nextIndex = minIndex;
            } else if (event.key === END) {
              nextIndex = maxIndex;
            }
          }

          if (
            nextIndex === highlightedIndex &&
            [...forwardKeys, ...backwardKeys].includes(event.key)
          ) {
            if (loop && nextIndex === maxIndex && forwardKeys.includes(event.key)) {
              nextIndex = minIndex;
            } else if (loop && nextIndex === minIndex && backwardKeys.includes(event.key)) {
              nextIndex = maxIndex;
            } else {
              nextIndex = findNonDisabledIndex(elementsRef, {
                startingIndex: nextIndex,
                decrement: backwardKeys.includes(event.key),
                disabledIndices,
              });
            }
          }

          if (nextIndex !== highlightedIndex && !isIndexOutOfBounds(elementsRef, nextIndex)) {
            if (stopEventPropagation) {
              event.stopPropagation();
            }

            if (preventedKeys.includes(event.key)) {
              event.preventDefault();
            }
            onHighlightedIndexChange(nextIndex);

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
      disabledIndices,
      elementsRef,
      enableHomeAndEndKeys,
      highlightedIndex,
      isGrid,
      itemSizes,
      loop,
      mergedRef,
      onHighlightedIndexChange,
      orientation,
      stopEventPropagation,
    ],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      highlightedIndex,
      onHighlightedIndexChange,
      elementsRef,
      disabledIndices,
    }),
    [getRootProps, highlightedIndex, onHighlightedIndexChange, elementsRef, disabledIndices],
  );
}
