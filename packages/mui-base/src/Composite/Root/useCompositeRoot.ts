import * as React from 'react';
import { useEventCallback } from '../../utils/useEventCallback';
import { mergeReactProps } from '../../utils/mergeReactProps';
import {
  ALL_KEYS,
  ARROW_DOWN,
  ARROW_LEFT,
  ARROW_RIGHT,
  ARROW_UP,
  buildCellMap,
  findNonDisabledIndex,
  getCellIndexOfCorner,
  getCellIndices,
  getGridNavigatedIndex,
  getMaxIndex,
  getMinIndex,
  HORIZONTAL_KEYS,
  isDisabled,
  isIndexOutOfBounds,
  VERTICAL_KEYS,
  type Dimensions,
} from '../composite';

export interface UseCompositeRootParameters {
  orientation?: 'horizontal' | 'vertical';
  cols?: number;
  loop?: boolean;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  dense?: boolean;
  itemSizes?: Array<Dimensions>;
}

// TODO
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
    orientation = 'horizontal',
    activeIndex: externalActiveIndex,
    onActiveIndexChange: externalSetActiveIndex,
  } = params;

  const [internalActiveIndex, internalSetActiveIndex] = React.useState(0);

  const activeIndex = externalActiveIndex ?? internalActiveIndex;
  const onActiveIndexChange = useEventCallback(externalSetActiveIndex ?? internalSetActiveIndex);
  const elementsRef = React.useRef<Array<HTMLDivElement | null>>([]);
  const isGrid = cols > 1;

  const getRootProps = React.useCallback(
    (externalProps = {}) =>
      mergeReactProps<'div'>(externalProps, {
        'aria-orientation': orientation,
        onKeyDown(event) {
          if (!ALL_KEYS.includes(event.key)) {
            return;
          }

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
                },
              )
            ] as number; // navigated cell will never be nullish
          }

          const toEndKeys = {
            horizontal: [ARROW_RIGHT],
            vertical: [ARROW_DOWN],
            both: [ARROW_RIGHT, ARROW_DOWN],
          }[orientation];

          const toStartKeys = {
            horizontal: [ARROW_LEFT],
            vertical: [ARROW_UP],
            both: [ARROW_LEFT, ARROW_UP],
          }[orientation];

          const preventedKeys = isGrid
            ? ALL_KEYS
            : {
                horizontal: HORIZONTAL_KEYS,
                vertical: VERTICAL_KEYS,
                both: ALL_KEYS,
              }[orientation];

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
    [activeIndex, cols, dense, isGrid, itemSizes, loop, onActiveIndexChange, orientation],
  );

  return React.useMemo(
    () => ({
      getRootProps,
      activeIndex,
      onActiveIndexChange,
      elementsRef,
    }),
    [getRootProps, activeIndex, onActiveIndexChange],
  );
}
