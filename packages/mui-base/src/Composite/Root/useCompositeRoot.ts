'use client';
import * as React from 'react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useEventCallback } from '../../utils/useEventCallback';
import { useForkRef } from '../../utils/useForkRef';
import {
  ALL_KEYS,
  ARROW_KEYS,
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  HOME,
  END,
  buildCellMap,
  findNonDisabledIndex,
  getCellIndexOfCorner,
  getCellIndices,
  getGridNavigatedIndex,
  getMaxIndex,
  getMinIndex,
  getTextDirection,
  HORIZONTAL_KEYS,
  HORIZONTAL_KEYS_WITH_EXTRA_KEYS,
  isDisabled,
  isIndexOutOfBounds,
  VERTICAL_KEYS,
  VERTICAL_KEYS_WITH_EXTRA_KEYS,
  type Dimensions,
  type TextDirection,
} from '../composite';

export interface UseCompositeRootParameters {
  orientation?: 'horizontal' | 'vertical' | 'both';
  cols?: number;
  loop?: boolean;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  dense?: boolean;
  itemSizes?: Array<Dimensions>;
  rootRef?: React.Ref<Element>;
  /**
   * When `true`, pressing the Home key moves focus to the first item,
   * and pressing the End key moves focus to the last item.
   * @default false
   */
  enableHomeAndEndKeys?: boolean;
}

// Advanced options of Composite, to be implemented later if needed.
const disabledIndices = undefined;

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
    activeIndex: externalActiveIndex,
    onActiveIndexChange: externalSetActiveIndex,
    rootRef: externalRef,
    enableHomeAndEndKeys = false,
  } = params;

  const [internalActiveIndex, internalSetActiveIndex] = React.useState(0);

  const isGrid = cols > 1;

  const activeIndex = externalActiveIndex ?? internalActiveIndex;
  const onActiveIndexChange = useEventCallback(externalSetActiveIndex ?? internalSetActiveIndex);

  const textDirectionRef = React.useRef<TextDirection | null>(null);

  const rootRef = React.useRef<HTMLElement | null>(null);
  const handleRootRef = useEventCallback((element: HTMLElement) => {
    if (!element) {
      return;
    }

    rootRef.current = element;

    textDirectionRef.current = getTextDirection(element);
  });
  const mergedRef = useForkRef(handleRootRef, externalRef);

  const elementsRef = React.useRef<Array<HTMLDivElement | null>>([]);

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-orientation': orientation === 'both' ? undefined : orientation,
        ref: mergedRef,
        onKeyDown(event) {
          const RELEVANT_KEYS = enableHomeAndEndKeys ? ALL_KEYS : ARROW_KEYS;

          if (!RELEVANT_KEYS.includes(event.key)) {
            return;
          }

          const isRtl = textDirectionRef?.current === 'rtl';

          let nextIndex = activeIndex;
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
                    activeIndex > maxIndex ? minIndex : activeIndex,
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

          const horizontalEndKey = isRtl ? ARROW_LEFT : ARROW_RIGHT;
          const toEndKeys = {
            horizontal: [horizontalEndKey],
            vertical: [ARROW_DOWN],
            both: [horizontalEndKey, ARROW_DOWN],
          }[orientation];

          const horizontalStartKey = isRtl ? ARROW_RIGHT : ARROW_LEFT;
          const toStartKeys = {
            horizontal: [horizontalStartKey],
            vertical: [ARROW_UP],
            both: [horizontalStartKey, ARROW_UP],
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

          if (nextIndex === activeIndex && [...toEndKeys, ...toStartKeys].includes(event.key)) {
            if (loop && nextIndex === maxIndex && toEndKeys.includes(event.key)) {
              nextIndex = minIndex;
            } else if (loop && nextIndex === minIndex && toStartKeys.includes(event.key)) {
              nextIndex = maxIndex;
            } else {
              nextIndex = findNonDisabledIndex(elementsRef, {
                startingIndex: nextIndex,
                decrement: toStartKeys.includes(event.key),
                disabledIndices,
              });
            }
          }

          if (nextIndex !== activeIndex && !isIndexOutOfBounds(elementsRef, nextIndex)) {
            event.stopPropagation();

            if (preventedKeys.includes(event.key)) {
              event.preventDefault();
            }

            onActiveIndexChange(nextIndex);

            // Wait for FocusManager `returnFocus` to execute.
            queueMicrotask(() => {
              elementsRef.current[nextIndex]?.focus();
            });
          }
        },
      }),
    [
      activeIndex,
      cols,
      dense,
      elementsRef,
      isGrid,
      itemSizes,
      loop,
      mergedRef,
      onActiveIndexChange,
      orientation,
      enableHomeAndEndKeys,
    ],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      activeIndex,
      onActiveIndexChange,
      elementsRef,
    }),
    [getRootProps, activeIndex, onActiveIndexChange, elementsRef],
  );
}
